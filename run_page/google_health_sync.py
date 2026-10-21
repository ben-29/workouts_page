import argparse
import datetime
import io
import json
import os
import re

import gpxpy.gpx
import httpx
import lxml.etree as ET
from sqlalchemy import func

from config import JSON_FILE, SQL_FILE, FOLDER_DICT
from generator import Generator
from generator.db import Activity
from gpxtrackposter.track import Track
from synced_data_file_logger import load_synced_file_list

GOOGLE_HEALTH_API_BASE_URL = "https://health.googleapis.com/v4"
GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
ACTIVITY_AND_FITNESS_SCOPE = (
    "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly"
)
LOCATION_SCOPE = "https://www.googleapis.com/auth/googlehealth.location.readonly"
GOOGLE_HEALTH_FILE_PREFIX = "google-health"
SUPPORTED_EXPORT_FORMATS = ("tcx", "gpx")


def _parse_date(value):
    if not value:
        return None
    return datetime.date.fromisoformat(value)


def _get_since_date_from_db(generator):
    last_activity = generator.session.query(
        func.max(Activity.start_date_local)
    ).scalar()
    if not last_activity:
        return None
    return datetime.datetime.fromisoformat(last_activity).isoformat(timespec="seconds")


def _safe_filename(value):
    value = value.lower().replace("_", "-")
    value = re.sub(r"[^a-z0-9-]+", "-", value)
    return value.strip("-") or "unknown"


def _exercise_id(data_point):
    name = data_point.get("name", "")
    return _safe_filename(name.rsplit("/", 1)[-1])


def _exercise_title(data_point):
    exercise = data_point.get("exercise") or {}
    notes = (exercise.get("notes") or "").strip()
    return notes or exercise.get("displayName") or exercise.get("exerciseType") or ""


def _exercise_type(data_point):
    exercise = data_point.get("exercise") or {}
    return exercise.get("exerciseType") or ""


def _gpx_activity_type(data_point):
    exercise_type = _exercise_type(data_point).lower()
    return {
        "running": "Run",
        "trail_run": "Run",
        "walking": "Hike",
        "hiking": "Hike",
        "biking": "Ride",
        "outdoor_bike": "Ride",
        "electric_bike": "Ride",
        "road_biking": "Ride",
        "mountain_biking": "Ride",
        "skiing": "Ski",
        "snowboarding": "Snowboard",
        "swimming_open_water": "Swim",
        "swimming_pool": "Swim",
    }.get(exercise_type, exercise_type or "other")


def _parse_datetime(value):
    if not value:
        return None
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


def _format_datetime(value):
    return value.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")


def _format_utc_datetime(value):
    if value.tzinfo:
        value = value.astimezone(datetime.timezone.utc)
    return _format_datetime(value)


def _format_gpx_time(value):
    parsed = _parse_datetime(value)
    if not parsed:
        return None
    if not parsed.tzinfo:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed.astimezone(datetime.timezone.utc)


def _parse_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _output_file_name(file_id, export_format):
    return f"{GOOGLE_HEALTH_FILE_PREFIX}-{file_id}.{export_format}"


def _metadata_key(file_id):
    return f"{GOOGLE_HEALTH_FILE_PREFIX}-{file_id}"


def _output_file_path(file_id, export_format):
    return os.path.join(
        FOLDER_DICT[export_format],
        _output_file_name(file_id, export_format),
    )


def _extract_average_heartrate(data_point):
    exercise = data_point.get("exercise") or {}
    metrics_summary = (
        exercise.get("metricsSummary")
        or exercise.get("metrics_summary")
        or data_point.get("metricsSummary")
        or data_point.get("metrics_summary")
    )
    if not isinstance(metrics_summary, dict):
        return None

    candidates = [
        "averageHeartRateBeatsPerMinute",
        "averageHeartRateBpm",
        "averageHeartRate",
        "heartRateBeatsPerMinute",
        "heartRateBpm",
        "bpm",
    ]
    for key in candidates:
        value = metrics_summary.get(key)
        if value is not None:
            return float(value)

    for key, value in metrics_summary.items():
        normalized_key = key.lower()
        if "heart" in normalized_key and (
            "average" in normalized_key or "avg" in normalized_key
        ):
            return float(value)

    return None


def _extract_activity_times(data_point):
    exercise = data_point.get("exercise") or {}
    interval = exercise.get("interval") or data_point.get("interval") or {}
    start_time = _parse_datetime(
        interval.get("startTime") or interval.get("start_time")
    )
    end_time = _parse_datetime(interval.get("endTime") or interval.get("end_time"))
    civil_start_time = _parse_datetime(
        interval.get("civilStartTime") or interval.get("civil_start_time")
    )
    civil_end_time = _parse_datetime(
        interval.get("civilEndTime") or interval.get("civil_end_time")
    )

    return {
        "start_date": _format_utc_datetime(start_time) if start_time else None,
        "end": _format_utc_datetime(end_time) if end_time else None,
        "start_date_local": (
            _format_datetime(civil_start_time) if civil_start_time else None
        ),
        "end_local": _format_datetime(civil_end_time) if civil_end_time else None,
    }


def _google_health_metadata(data_point):
    return {
        "average_heartrate": _extract_average_heartrate(data_point),
        **_extract_activity_times(data_point),
    }


def _load_track(file_path, export_format):
    track = Track()
    if export_format == "gpx":
        track.load_gpx(file_path)
    else:
        track.load_tcx(file_path)
    if not track.run_id:
        return None
    return track


def _metadata_from_tcx_track(track):
    metadata = {}
    if track.start_time:
        metadata["start_date"] = _format_utc_datetime(track.start_time)
        if track.start_time.tzinfo and track.start_time.utcoffset():
            metadata["start_date_local"] = _format_datetime(track.start_time)
    if track.end_time:
        metadata["end"] = _format_utc_datetime(track.end_time)
        if track.end_time.tzinfo and track.end_time.utcoffset():
            metadata["end_local"] = _format_datetime(track.end_time)
    return metadata


def _run_id_from_metadata(metadata):
    start_date = _parse_datetime(metadata.get("start_date")) if metadata else None
    if not start_date:
        return None
    if not start_date.tzinfo:
        start_date = start_date.replace(tzinfo=datetime.timezone.utc)
    return int(start_date.timestamp() * 1000)


def _apply_google_health_metadata(generator, metadata_by_file_id, export_format):
    updated = 0
    for file_id, metadata in metadata_by_file_id.items():
        track = None
        run_id = None
        file_path = _output_file_path(file_id, export_format)
        if os.path.exists(file_path):
            track = _load_track(file_path, export_format)
            if track:
                run_id = track.run_id
        if not run_id:
            run_id = _run_id_from_metadata(metadata)
        if not run_id:
            continue

        activity = generator.session.query(Activity).filter_by(run_id=run_id).first()
        if not activity:
            continue

        if track:
            metadata = {
                **metadata,
                **_metadata_from_tcx_track(track),
            }

        if metadata.get("average_heartrate") is not None:
            activity.average_heartrate = metadata["average_heartrate"]
        if metadata.get("start_date"):
            activity.start_date = metadata["start_date"]
        if metadata.get("start_date_local"):
            activity.start_date_local = metadata["start_date_local"]

        updated += 1

    generator.session.commit()
    if updated:
        print(f"updated Google Health metadata for {updated} activities")


def _append_gpx_extension(gpx, name, value):
    if value is None:
        return
    extension = ET.Element(name)
    extension.text = str(value)
    gpx.extensions.append(extension)


def _tcx_to_gpx(tcx_data, data_point, metadata):
    ns = {"tcx": "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"}
    root = ET.parse(io.BytesIO(tcx_data)).getroot()

    gpx = gpxpy.gpx.GPX()
    gpx.nsmap["gpxtpx"] = "http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
    gpx.creator = "google_health"
    gpx.name = _exercise_title(data_point)

    track = gpxpy.gpx.GPXTrack()
    track.name = gpx.name
    track.type = _gpx_activity_type(data_point)
    gpx.tracks.append(track)

    segment = gpxpy.gpx.GPXTrackSegment()
    track.segments.append(segment)

    distance = None
    total_time = None
    for lap in root.findall(".//tcx:Lap", ns):
        distance = _parse_float(lap.findtext("tcx:DistanceMeters", namespaces=ns))
        total_time = _parse_float(lap.findtext("tcx:TotalTimeSeconds", namespaces=ns))
        break

    for trackpoint in root.findall(".//tcx:Trackpoint", ns):
        latitude = _parse_float(
            trackpoint.findtext("tcx:Position/tcx:LatitudeDegrees", namespaces=ns)
        )
        longitude = _parse_float(
            trackpoint.findtext("tcx:Position/tcx:LongitudeDegrees", namespaces=ns)
        )
        point_time = _format_gpx_time(trackpoint.findtext("tcx:Time", namespaces=ns))
        if latitude is None or longitude is None or point_time is None:
            continue

        point = gpxpy.gpx.GPXTrackPoint(
            latitude=latitude,
            longitude=longitude,
            elevation=_parse_float(
                trackpoint.findtext("tcx:AltitudeMeters", namespaces=ns)
            ),
            time=point_time,
        )

        heartrate = trackpoint.findtext("tcx:HeartRateBpm/tcx:Value", namespaces=ns)
        if heartrate is not None:
            point.extensions.append(
                ET.fromstring(
                    f'<gpxtpx:TrackPointExtension xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"><gpxtpx:hr>{heartrate}</gpxtpx:hr></gpxtpx:TrackPointExtension>'
                )
            )

        segment.points.append(point)

    average_hr = metadata.get("average_heartrate")
    elapsed_time = total_time
    start_date = _parse_datetime(metadata.get("start_date"))
    end_date = _parse_datetime(metadata.get("end"))
    if start_date and end_date:
        elapsed_time = (end_date - start_date).total_seconds()

    _append_gpx_extension(gpx, "average_hr", average_hr)
    _append_gpx_extension(gpx, "distance", distance)
    _append_gpx_extension(gpx, "moving_time", total_time)
    _append_gpx_extension(gpx, "elapsed_time", elapsed_time)
    _append_gpx_extension(
        gpx,
        "average_speed",
        distance / total_time if distance and total_time else None,
    )

    return gpx.to_xml().encode("utf-8")


def _enrich_tcx(tcx_data, data_point):
    """
    Preserve activity notes and the precise v4 API exerciseType in TCX.

    TCX activities store free-form text in Notes; their imported name is supplied
    separately via activity_title_dict using the same notes-first title.

    The TCX schema only allows Sport="Running", "Biking", or "Other", so activities
    like Hiking, Strength Training, Swimming, etc. all get Sport="Other".  By storing
    the precise type from the Google Health v4 API we let track.py recover the real
    activity type without guessing.

    Resulting XML (inside <Activity>):
        <Extensions>
          <ExerciseType xmlns="http://schemas.google.com/health/tcx">HIKING</ExerciseType>
        </Extensions>
    """
    exercise_type = _exercise_type(data_point)
    exercise = data_point.get("exercise") or {}
    notes = (exercise.get("notes") or "").strip()
    if not exercise_type and not notes:
        return tcx_data

    GH_EXT_NS = "http://schemas.google.com/health/tcx"

    try:
        root = ET.parse(io.BytesIO(tcx_data)).getroot()
        ns = ET.QName(root).namespace
        tag = lambda name: f"{{{ns}}}{name}" if ns else name

        activity_el = root.find(f".//{tag('Activity')}")
        if activity_el is None:
            return tcx_data

        if notes:
            notes_el = activity_el.find(tag("Notes"))
            if notes_el is None:
                notes_el = ET.Element(tag("Notes"))
                # The TCX schema places Notes after laps and before these fields.
                following_tags = {
                    tag(name) for name in ("Training", "Creator", "Extensions")
                }
                insert_at = next(
                    (
                        i for i, child in enumerate(activity_el)
                        if child.tag in following_tags
                    ),
                    len(activity_el),
                )
                activity_el.insert(insert_at, notes_el)
            notes_el.text = notes

        if exercise_type:
            ext_el = activity_el.find(tag("Extensions"))
            if ext_el is None:
                ext_el = ET.SubElement(activity_el, tag("Extensions"))
            type_el = ext_el.find(f"{{{GH_EXT_NS}}}ExerciseType")
            if type_el is None:
                type_el = ET.SubElement(ext_el, f"{{{GH_EXT_NS}}}ExerciseType")
            type_el.text = exercise_type

        return ET.tostring(root, xml_declaration=True, encoding="utf-8")
    except Exception as e:
        print(f"Warning: could not enrich TCX activity metadata: {e}")
        return tcx_data


def _prepare_export_data(tcx_data, data_point, metadata, export_format):
    if export_format == "gpx":
        return _tcx_to_gpx(tcx_data, data_point, metadata)
    return _enrich_tcx(tcx_data, data_point)



class GoogleHealthClient:
    def __init__(self, client_id, client_secret, refresh_token):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.access_token = ""

    def refresh_access(self):
        response = httpx.post(
            GOOGLE_OAUTH_TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=30,
        )
        response.raise_for_status()
        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.refresh_token = token_data.get("refresh_token", self.refresh_token)
        print("Google Health access ok")

    def _headers(self, accept="application/json"):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": accept,
        }

    def _get_json(self, path, params=None):
        response = httpx.get(
            f"{GOOGLE_HEALTH_API_BASE_URL}{path}",
            params=params,
            headers=self._headers(),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def list_exercises(self, since_date=None, until_date=None, only_run=False):
        params = {"pageSize": 25}
        filters = []
        if since_date:
            filters.append(f'exercise.interval.civil_start_time >= "{since_date}"')
        if until_date:
            filters.append(f'exercise.interval.civil_start_time < "{until_date}"')
        if filters:
            params["filter"] = " AND ".join(filters)

        while True:
            data = self._get_json(
                "/users/me/dataTypes/exercise/dataPoints",
                params=params,
            )
            for data_point in data.get("dataPoints", []):
                exercise = data_point.get("exercise") or {}
                if only_run and exercise.get("exerciseType") != "RUNNING":
                    continue
                yield data_point

            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
            params["pageToken"] = next_page_token

    def download_exercise_tcx(self, data_point_name, partial_data=True):
        response = httpx.get(
            f"{GOOGLE_HEALTH_API_BASE_URL}/{data_point_name}:exportExerciseTcx",
            params={"alt": "media", "partialData": str(partial_data).lower()},
            headers=self._headers(accept="application/xml"),
            timeout=120,
        )
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            tcx_data = response.json().get("tcxData", "")
            return tcx_data.encode("utf-8")
        return response.content


def run_google_health_sync(
    client_id,
    client_secret,
    refresh_token,
    only_run=False,
    start_date=None,
    end_date=None,
    all_data=False,
    export_format="tcx",
):
    if export_format not in SUPPORTED_EXPORT_FORMATS:
        raise ValueError(f"export_format must be one of {SUPPORTED_EXPORT_FORMATS}")

    output_folder = FOLDER_DICT[export_format]
    os.makedirs(output_folder, exist_ok=True)

    generator = Generator(SQL_FILE)
    generator.only_run = only_run

    since_date = None if all_data else start_date or _get_since_date_from_db(generator)
    until_date = end_date

    client = GoogleHealthClient(client_id, client_secret, refresh_token)
    client.refresh_access()

    synced_files = set(load_synced_file_list())
    activity_title_dict = {}
    metadata_by_file_id = {}
    downloaded = 0
    skipped = 0

    print(f"Start syncing Google Health exercise data as {export_format.upper()}")
    for data_point in client.list_exercises(since_date, until_date, only_run=only_run):
        data_point_name = data_point.get("name")
        if not data_point_name:
            skipped += 1
            continue

        file_id = _exercise_id(data_point)
        file_name = _output_file_name(file_id, export_format)
        file_path = _output_file_path(file_id, export_format)
        activity_title_dict[_metadata_key(file_id)] = _exercise_title(data_point)

        if file_name in synced_files or os.path.exists(file_path):
            skipped += 1
            continue

        try:
            tcx_data = client.download_exercise_tcx(data_point_name)
            if not tcx_data:
                print(f"skip empty TCX for {data_point_name}")
                skipped += 1
                continue
            metadata = _google_health_metadata(data_point)
            export_data = _prepare_export_data(
                tcx_data,
                data_point,
                metadata,
                export_format,
            )
            with open(file_path, "wb") as f:
                f.write(export_data)
            metadata_by_file_id[file_id] = metadata
            downloaded += 1
            print(f"downloaded {file_name}")
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            print(f"download {data_point_name} failed with status {status_code}")
            skipped += 1

    generator.sync_from_data_dir(
        output_folder,
        file_suffix=export_format,
        activity_title_dict=activity_title_dict,
    )
    if metadata_by_file_id:
        _apply_google_health_metadata(generator, metadata_by_file_id, export_format)
    activities_list = generator.load()
    with open(JSON_FILE, "w") as f:
        json.dump(activities_list, f)

    print(f"Google Health sync finished: {downloaded} downloaded, {skipped} skipped")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("client_id", help="Google OAuth client id")
    parser.add_argument("client_secret", help="Google OAuth client secret")
    parser.add_argument("refresh_token", help="Google OAuth refresh token")
    parser.add_argument(
        "--only-run",
        dest="only_run",
        action="store_true",
        help="only sync running exercises",
    )
    parser.add_argument(
        "--start-date",
        type=_parse_date,
        help=(
            "sync exercises whose civil start date is on or after YYYY-MM-DD; "
            "default uses latest start_date_local in data.db"
        ),
    )
    parser.add_argument(
        "--end-date",
        type=_parse_date,
        help="sync exercises whose civil start date is before YYYY-MM-DD",
    )
    parser.add_argument(
        "--all",
        dest="all_data",
        action="store_true",
        help="ignore the local database date and ask Google Health for all exercises",
    )
    parser.add_argument(
        "--format",
        dest="export_format",
        choices=SUPPORTED_EXPORT_FORMATS,
        default="tcx",
        help="export file format, default is tcx",
    )
    options = parser.parse_args()
    run_google_health_sync(
        options.client_id,
        options.client_secret,
        options.refresh_token,
        only_run=options.only_run,
        start_date=options.start_date,
        end_date=options.end_date,
        all_data=options.all_data,
        export_format=options.export_format,
    )
