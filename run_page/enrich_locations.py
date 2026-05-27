#!/usr/bin/env python3
"""Enrich activity locations with cached English reverse geocoding."""

import argparse
import json
import time
from pathlib import Path

import polyline
from geopy.exc import GeocoderServiceError, GeocoderTimedOut
from geopy.geocoders import Nominatim

from config import JSON_FILE, SQL_FILE
from generator import Generator
from generator.db import Activity, init_db


GEOCODER = Nominatim(user_agent="cleopas_strava_location_enrichment")
TOKYO_WARDS = {
    "Adachi",
    "Arakawa",
    "Bunkyo",
    "Chiyoda",
    "Chuo",
    "Edogawa",
    "Itabashi",
    "Katsushika",
    "Kita",
    "Koto",
    "Meguro",
    "Minato",
    "Nakano",
    "Nerima",
    "Ota",
    "Setagaya",
    "Shibuya",
    "Shinagawa",
    "Shinjuku",
    "Suginami",
    "Sumida",
    "Taito",
    "Toshima",
}


def load_cache(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_cache(path: Path, cache: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def decode_location(activity: Activity) -> tuple[float, float] | None:
    if not activity.summary_polyline:
        return None
    try:
        points = polyline.decode(activity.summary_polyline)
    except Exception:
        return None
    if not points:
        return None
    lat, lon = points[min(len(points) // 2, len(points) - 1)]
    return lat, lon


def parse_existing(location_country: str | None) -> dict | None:
    if not location_country:
        return None
    try:
        parsed = json.loads(location_country)
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict):
        return None
    if parsed.get("country") or parsed.get("province") or parsed.get("city"):
        return parsed
    return None


def geocode(lat: float, lon: float, retries: int = 3) -> dict | None:
    for attempt in range(retries):
        try:
            location = GEOCODER.reverse(
                f"{lat}, {lon}", language="en", timeout=15, addressdetails=True
            )
            if not location:
                return None
            address = location.raw.get("address", {}) if location.raw else {}
            city = (
                address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("municipality")
                or address.get("county")
            )
            province = (
                address.get("state")
                or address.get("province")
                or address.get("region")
                or address.get("county")
            )
            country = address.get("country")
            if country == "Japan" and not province and city in TOKYO_WARDS:
                province = "Tokyo Metropolis"
            return {
                "city": city or "",
                "province": province or "",
                "country": country or "",
                "coordinate": [lon, lat],
                "display": location.address,
            }
        except (GeocoderTimedOut, GeocoderServiceError) as exc:
            if attempt == retries - 1:
                print(f"geocode failed at {lat},{lon}: {exc}")
                return None
            time.sleep(2**attempt)
        except Exception as exc:
            print(f"unexpected geocode error at {lat},{lon}: {exc}")
            return None
    return None


def export_json(db_path: str, json_path: str) -> None:
    generator = Generator(db_path)
    activities = generator.loadForMapping()
    Path(json_path).write_text(
        json.dumps(activities, ensure_ascii=False, indent=0), encoding="utf-8"
    )


def enrich_locations(db_path: str, cache_path: Path, limit: int | None) -> int:
    session = init_db(db_path)
    cache = load_cache(cache_path)
    coordinate_cache = cache.setdefault("__coordinate_cache", {})
    updated = 0

    try:
        activities = (
            session.query(Activity)
            .filter(Activity.summary_polyline.isnot(None))
            .order_by(Activity.start_date_local)
            .all()
        )
        for activity in activities:
            run_id = str(activity.run_id)
            cached = cache.get(run_id) or parse_existing(activity.location_country)
            if cached:
                cache[run_id] = cached
                if activity.location_country != json.dumps(cached, ensure_ascii=False):
                    activity.location_country = json.dumps(cached, ensure_ascii=False)
                    session.add(activity)
                    updated += 1
                continue

            coords = decode_location(activity)
            if not coords:
                continue
            lat, lon = coords
            coord_key = f"{lat:.1f},{lon:.1f}"
            location = coordinate_cache.get(coord_key)
            if not location:
                location = geocode(lat, lon)
                if location:
                    coordinate_cache[coord_key] = location
            if not location:
                continue

            cache[run_id] = location
            activity.location_country = json.dumps(location, ensure_ascii=False)
            session.add(activity)
            updated += 1
            session.commit()
            write_cache(cache_path, cache)
            print(f"enriched {run_id}: {location.get('city')}, {location.get('country')}")

            if limit is not None and updated >= limit:
                break
            time.sleep(1)

        session.commit()
        write_cache(cache_path, cache)
    finally:
        session.close()

    return updated


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=SQL_FILE)
    parser.add_argument("--json", default=JSON_FILE)
    parser.add_argument("--cache", default="src/static/location-cache.json")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    updated = enrich_locations(args.db, Path(args.cache), args.limit)
    export_json(args.db, args.json)
    print(f"Location enrichment updated {updated} activities")


if __name__ == "__main__":
    main()
