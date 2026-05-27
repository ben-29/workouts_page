import { chinaCities } from '@/static/city';
import {
  MUNICIPALITY_CITIES_ARR,
  RUN_TITLES,
  RIDE_COLOR,
  VIRTUAL_RIDE_COLOR,
  HIKE_COLOR,
  SWIM_COLOR,
  ROWING_COLOR,
  ROAD_TRIP_COLOR,
  FLIGHT_COLOR,
  RUN_COLOR,
  KAYAKING_COLOR,
  SNOWBOARD_COLOR,
  TRAIL_RUN_COLOR,
  RICH_TITLE,
  getRuntimeSingleColor,
} from './const';
import locationCacheData from '@/static/location-cache.json';

export type Coordinate = [number, number];

export type RunIds = Array<number> | [];

// Check for units environment variable
const IS_IMPERIAL = import.meta.env.VITE_USE_IMPERIAL === 'true';
export const M_TO_DIST = IS_IMPERIAL ? 1609.344 : 1000; // Meters to Mi or Km
export const M_TO_ELEV = IS_IMPERIAL ? 3.28084 : 1; // Meters to Feet or Meters
export const DIST_UNIT = IS_IMPERIAL ? 'mi' : 'KM'; // Label
export const ELEV_UNIT = IS_IMPERIAL ? 'ft' : 'm'; // Label

export interface Activity {
  run_id: number;
  name: string;
  distance: number;
  moving_time: string;
  type: string;
  subtype: string;
  start_date: string;
  start_date_local: string;
  location_country?: string | null;
  summary_polyline?: string | null;
  average_heartrate?: number | null;
  elevation_gain: number | null;
  average_speed: number;
  streak: number;
}

const titleForShow = (run: Activity): string => {
  const date = run.start_date_local.slice(0, 11);
  const distance = (run.distance / M_TO_DIST).toFixed(2);
  let name = 'Run';
  if (run.name) {
    name = run.name;
  }
  return `${name} ${date} ${distance} ${DIST_UNIT} ${
    !run.summary_polyline ? '(No map data for this workout)' : ''
  }`;
};

const formatPace = (d: number): string => {
  if (Number.isNaN(d) || d == 0) return '0';
  const pace = (M_TO_DIST / 60.0) * (1.0 / d);
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60.0);
  return `${minutes}'${seconds.toFixed(0).toString().padStart(2, '0')}"`;
};

const convertMovingTime2Sec = (moving_time: string): number => {
  if (!moving_time) {
    return 0;
  }
  // moving_time : '2 days, 12:34:56' or '12:34:56';
  const splits = moving_time.split(', ');
  const days = splits.length == 2 ? parseInt(splits[0]) : 0;
  const time = splits.splice(-1)[0];
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const totalSeconds = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
  return totalSeconds;
};

const formatRunTime = (moving_time: string): string => {
  const totalSeconds = convertMovingTime2Sec(moving_time);
  const seconds = totalSeconds % 60;
  const minutes = (totalSeconds - seconds) / 60;
  if (minutes === 0) {
    return seconds + 's';
  }
  return minutes + 'min';
};

// for scroll to the map
const scrollToMap = () => {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const extractCities = (str: string): string[] => {
  const locations = [];
  let match;
  const pattern = /([\u4e00-\u9fa5]{2,}(市|自治州|特别行政区|盟|地区))/g;
  while ((match = pattern.exec(str)) !== null) {
    locations.push(match[0]);
  }

  return locations;
};

const extractDistricts = (str: string): string[] => {
  const locations = [];
  let match;
  const pattern = /([\u4e00-\u9fa5]{2,}(区|县))/g;
  while ((match = pattern.exec(str)) !== null) {
    locations.push(match[0]);
  }

  return locations;
};

const extractCoordinate = (str: string): [number, number] | null => {
  const pattern = /'latitude': ([-]?\d+\.\d+).*?'longitude': ([-]?\d+\.\d+)/;
  const match = str.match(pattern);

  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    return [longitude, latitude];
  }

  return null;
};

const cities = chinaCities.map((c) => c.name);
const locationCache = new Map<number, ReturnType<typeof locationForRun>>();
const enrichedLocations = locationCacheData as Record<
  string,
  {
    city?: string | null;
    province?: string | null;
    country?: string | null;
    coordinate?: [number, number] | null;
  }
>;

const parseEnrichedLocation = (
  location: string | null | undefined
): {
  country: string;
  province: string;
  city: string;
  coordinate: [number, number] | null;
} | null => {
  if (!location) return null;
  try {
    const parsed = JSON.parse(location) as {
      country?: string | null;
      province?: string | null;
      city?: string | null;
      coordinate?: [number, number] | null;
    };
    if (parsed && (parsed.country || parsed.province || parsed.city)) {
      return {
        country: parsed.country ?? '',
        province: parsed.province ?? '',
        city: parsed.city ?? '',
        coordinate: parsed.coordinate ?? null,
      };
    }
  } catch {
    // Fall back to parsing plain geocoder display text below.
  }

  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{3,}/.test(part));

  if (parts.length < 2) return null;
  const country = parts[parts.length - 1] ?? '';
  const province = parts.length >= 3 ? parts[parts.length - 2] : '';
  const city = parts[0] === province ? (parts[1] ?? '') : (parts[0] ?? '');
  return { country, province, city, coordinate: extractCoordinate(location) };
};

// what about oversea?
const locationForRun = (
  run: Activity
): {
  country: string;
  province: string;
  city: string;
  coordinate: [number, number] | null;
} => {
  if (locationCache.has(run.run_id)) {
    return locationCache.get(run.run_id)!;
  }
  const cachedLocation = enrichedLocations[String(run.run_id)];
  if (cachedLocation) {
    const r = {
      country: cachedLocation.country ?? '',
      province: cachedLocation.province ?? '',
      city: cachedLocation.city ?? '',
      coordinate: cachedLocation.coordinate ?? null,
    };
    locationCache.set(run.run_id, r);
    return r;
  }
  let location = run.location_country;
  let [city, province, country] = ['', '', ''];
  let coordinate = null;
  if (location) {
    const enrichedLocation = parseEnrichedLocation(location);
    if (enrichedLocation) {
      locationCache.set(run.run_id, enrichedLocation);
      return enrichedLocation;
    }
    // Only for Chinese now
    // should filter 臺灣
    const cityMatch = extractCities(location);
    const provinceMatch = location.match(/[\u4e00-\u9fa5]{2,}(省|自治区)/);

    if (cityMatch) {
      city = cities.find((value) => cityMatch.includes(value)) as string;

      if (!city) {
        city = '';
      }
    }
    if (provinceMatch) {
      [province] = provinceMatch;
      // try to extract city coord from location_country info
      coordinate = extractCoordinate(location);
    }
    const l = location.split(',');
    // or to handle keep location format
    let countryMatch = l[l.length - 1].match(
      /[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/
    );
    if (!countryMatch && l.length >= 3) {
      countryMatch = l[2].match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/);
    }
    if (countryMatch) {
      [country] = countryMatch;
    }
  }
  if (MUNICIPALITY_CITIES_ARR.includes(city)) {
    province = city;
    if (location) {
      const districtMatch = extractDistricts(location);
      if (districtMatch.length > 0) {
        city = districtMatch[districtMatch.length - 1];
      }
    }
  }

  const r = { country, province, city, coordinate };
  locationCache.set(run.run_id, r);
  return r;
};

const intComma = (x = '') => {
  if (x.toString().length <= 5) {
    return x;
  }
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const titleForType = (type: string): string => {
  switch (type) {
    case 'Run':
      return RUN_TITLES.RUN_TITLE;
    case 'Full Marathon':
      return RUN_TITLES.FULL_MARATHON_RUN_TITLE;
    case 'Half Marathon':
      return RUN_TITLES.HALF_MARATHON_RUN_TITLE;
    case 'Trail Run':
      return RUN_TITLES.TRAIL_RUN_TITLE;
    case 'Ride':
      return RUN_TITLES.RIDE_TITLE;
    case 'Indoor Ride':
      return RUN_TITLES.INDOOR_RIDE_TITLE;
    case 'VirtualRide':
      return RUN_TITLES.VIRTUAL_RIDE_TITLE;
    case 'Hike':
      return RUN_TITLES.HIKE_TITLE;
    case 'Rowing':
      return RUN_TITLES.ROWING_TITLE;
    case 'Swim':
      return RUN_TITLES.SWIM_TITLE;
    case 'RoadTrip':
      return RUN_TITLES.ROAD_TRIP_TITLE;
    case 'Flight':
      return RUN_TITLES.FLIGHT_TITLE;
    case 'Kayaking':
      return RUN_TITLES.KAYAKING_TITLE;
    case 'Snowboard':
      return RUN_TITLES.SNOWBOARD_TITLE;
    case 'BackcountrySki':
      return RUN_TITLES.BACKCOUNTRY_SKI_TITLE;
    case 'Ski':
      return RUN_TITLES.SKI_TITLE;
    default:
      return RUN_TITLES.RUN_TITLE;
  }
};

const typeForRun = (run: Activity): string => {
  const type = run.type;
  var distance = run.distance / 1000;
  switch (type) {
    case 'Run':
      if (distance >= 40) {
        return 'Full Marathon';
      } else if (distance > 20) {
        return 'Half Marathon';
      }
      return 'Run';
    case 'Trail Run':
      if (distance >= 40) {
        return 'Full Marathon';
      } else if (distance > 20) {
        return 'Half Marathon';
      }
      return 'Trail Run';
    default:
      return type;
  }
};

const titleForRun = (run: Activity): string => {
  const type = run.type;
  if (RICH_TITLE) {
    // 1. try to use user defined name
    if (run.name != '') {
      return run.name;
    }
    // 2. try to use location+type if the location is available, eg. 'Shanghai Run'
    const { city } = locationForRun(run);
    const activity_sport = titleForType(typeForRun(run));
    if (city && city.length > 0 && activity_sport.length > 0) {
      return `${city} ${activity_sport}`;
    }
  }
  // 3. use time+length if location or type is not available
  if (type == 'Run' || type == 'Trail Run') {
    const runDistance = run.distance / 1000;
    if (runDistance >= 40) {
      return RUN_TITLES.FULL_MARATHON_RUN_TITLE;
    } else if (runDistance > 20) {
      return RUN_TITLES.HALF_MARATHON_RUN_TITLE;
    }
  }
  return titleForType(type);
};

const colorFromType = (workoutType: string): string => {
  switch (workoutType) {
    case 'Run':
      return getRuntimeSingleColor(RUN_COLOR);
    case 'Trail Run':
      return getRuntimeSingleColor(TRAIL_RUN_COLOR);
    case 'Ride':
    case 'Indoor Ride':
      return getRuntimeSingleColor(RIDE_COLOR);
    case 'VirtualRide':
      return getRuntimeSingleColor(VIRTUAL_RIDE_COLOR);
    case 'Hike':
      return getRuntimeSingleColor(HIKE_COLOR);
    case 'Rowing':
      return getRuntimeSingleColor(ROWING_COLOR);
    case 'Swim':
      return getRuntimeSingleColor(SWIM_COLOR);
    case 'RoadTrip':
      return getRuntimeSingleColor(ROAD_TRIP_COLOR);
    case 'Flight':
      return getRuntimeSingleColor(FLIGHT_COLOR);
    case 'Kayaking':
      return getRuntimeSingleColor(KAYAKING_COLOR);
    case 'Snowboard':
    case 'Ski':
    case 'BackcountrySki':
      return getRuntimeSingleColor(SNOWBOARD_COLOR);
    default:
      return getRuntimeSingleColor();
  }
};

const filterYearRuns = (run: Activity, year: string) => {
  if (run && run.start_date_local) {
    return run.start_date_local.slice(0, 4) === year;
  }
  return false;
};

const filterCityRuns = (run: Activity, city: string) => {
  if (run && run.location_country) {
    return run.location_country.includes(city);
  }
  return false;
};
const filterTitleRuns = (run: Activity, title: string) =>
  titleForRun(run) === title;

const filterTypeRuns = (run: Activity, type: string) => {
  switch (type) {
    case 'Full Marathon':
      return (
        (run.type === 'Run' || run.type === 'Trail Run') && run.distance > 40000
      );
    case 'Half Marathon':
      return (
        (run.type === 'Run' || run.type === 'Trail Run') &&
        run.distance < 40000 &&
        run.distance > 20000
      );
    default:
      return run.type === type;
  }
};

const filterAndSortRuns = (
  activities: Activity[],
  item: string,
  filterFunc: (_run: Activity, _bvalue: string) => boolean,
  sortFunc: (_a: Activity, _b: Activity) => number,
  item2: string | null,
  filterFunc2: ((_run: Activity, _bvalue: string) => boolean) | null
) => {
  let s = activities.slice();
  if (item !== 'Total') {
    s = activities.filter((run) => filterFunc(run, item));
  }
  if (filterFunc2 != null && item2 != null) {
    s = s.filter((run) => filterFunc2(run, item2));
  }
  return s.sort(sortFunc);
};

const sortDateFunc = (a: Activity, b: Activity) => {
  return (
    new Date(b.start_date_local.replace(' ', 'T')).getTime() -
    new Date(a.start_date_local.replace(' ', 'T')).getTime()
  );
};
const sortDateFuncReverse = (a: Activity, b: Activity) => sortDateFunc(b, a);

export {
  titleForShow,
  formatPace,
  scrollToMap,
  locationForRun,
  intComma,
  titleForRun,
  typeForRun,
  titleForType,
  filterYearRuns,
  filterCityRuns,
  filterTitleRuns,
  filterAndSortRuns,
  sortDateFunc,
  sortDateFuncReverse,
  filterTypeRuns,
  colorFromType,
  formatRunTime,
  convertMovingTime2Sec,
};
