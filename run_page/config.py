import os
from collections import namedtuple

# getting content root directory
current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)

OUTPUT_DIR = os.path.join(parent, "activities")
GPX_FOLDER = os.path.join(parent, "GPX_OUT")
TCX_FOLDER = os.path.join(parent, "TCX_OUT")
FIT_FOLDER = os.path.join(parent, "FIT_OUT")
PNG_FOLDER = os.path.join(parent, "PNG_OUT")
ENDOMONDO_FILE_DIR = os.path.join(parent, "Workouts")
FOLDER_DICT = {
    "gpx": GPX_FOLDER,
    "tcx": TCX_FOLDER,
    "fit": FIT_FOLDER,
}
SQL_FILE = os.path.join(parent, "run_page", "data.db")
JSON_FILE = os.path.join(parent, "src", "static", "activities.json")
SYNCED_FILE = os.path.join(parent, "imported.json")
SYNCED_ACTIVITY_FILE = os.path.join(parent, "synced_activity.json")
NAME_MAPPING_FILE = os.path.join(FIT_FOLDER, "name_mapping.json")

# TODO: Move into nike_sync NRC THINGS


BASE_TIMEZONE = "Asia/Shanghai"
UTC_TIMEZONE = "UTC"

start_point = namedtuple("start_point", "lat lon")
run_map = namedtuple("polyline", "summary_polyline")

# add more type here
TYPE_DICT = {
    "running": "Run",
    "RUN": "Run",
    "Run": "Run",
    "track_running": "Run",
    "trail_running": "Trail Run",
    "cycling": "Ride",
    "CYCLING": "Ride",
    "Ride": "Ride",
    "EBikeRide": "Ride",
    "E-Bike": "Ride",
    "road_biking": "Ride",
    "Road Bike": "Ride",
    "Mountain Bike": "Ride",
    "VirtualRide": "VirtualRide",
    "indoor_cycling": "Indoor Ride",
    "Indoor Bike ": "Indoor Ride",
    "walking": "Hike",
    "hiking": "Hike",
    "Walk": "Hike",
    "Hike": "Hike",
    "Swim": "Swim",
    "swimming": "Swim",
    "Pool Swim": "Swim",
    "Open Water": "Swim",
    "rowing": "Rowing",
    "RoadTrip": "RoadTrip",
    "flight": "Flight",
    "kayaking": "Kayaking",
    "Snowboard": "Snowboard",
    "resort_skiing_snowboarding_ws": "Ski",  # garmin
    "AlpineSki": "Ski",  # strava
    "Ski": "Ski",
    "BackcountrySki": "BackcountrySki",
    # google health v4 API exerciseType enum values (lowercase snake_case keys)
    "trail_run": "Run",
    "biking": "Ride",
    "outdoor_bike": "Ride",
    "electric_bike": "Ride",
    "mountain_biking": "Ride",
    "skiing": "Ski",
    "snowboarding": "Snowboard",
    "swimming_open_water": "Swim",
    "swimming_pool": "Swim",
    # google health v4 uppercase enum values (as returned by the API and injected
    # into TCX Extensions by google_health_sync.py)
    "RUNNING": "Run",
    "TRAIL_RUNNING": "Run",
    "TREADMILL": "Run",
    "HIKING": "Hike",
    "WALKING": "Hike",
    "BIKING": "Ride",
    "MOUNTAIN_BIKING": "Ride",
    "ROAD_BIKING": "Ride",
    "INDOOR_CYCLING": "Indoor Ride",
    "SWIMMING_POOL": "Swim",
    "SWIMMING_OPEN_WATER": "Swim",
    "ROWING": "Rowing",
    "KAYAKING": "Kayaking",
    "SKIING": "Ski",
    "SNOWBOARDING": "Snowboard",
    "STRENGTH_TRAINING": "Workout",
    "YOGA": "Workout",
    "PILATES": "Workout",
    "ELLIPTICAL": "Workout",
    "STAIR_CLIMBING": "Workout",
    "JUMP_ROPE": "Workout",
    "OTHER": "Workout",
}

MAPPING_TYPE = [
    "Hike",
    "Ride",
    "VirtualRide",
    "Rowing",
    "Run",
    "Trail Run",
    "Swim",
    "RoadTrip",
    "Kayaking",
    "Snowboard",
    "Ski",
    "BackcountrySki",
]

STRAVA_GARMIN_TYPE_DICT = {
    "Hike": "hiking",
    "Run": "running",
    "EBikeRide": "cycling",
    "VirtualRide": "VirtualRide",
    "Walk": "walking",
    "Swim": "swimming",
}
