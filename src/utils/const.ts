// Constants
const MAPBOX_TOKEN =
  // For security reasons, please avoid using the default public token provided by Mapbox as much as possible.
  // Instead, manually add a new token and apply URL restrictions.
  // (please refer to https://github.com/yihong0618/running_page/issues/643#issuecomment-2042668580)
  'pk.eyJ1IjoiYmVuLTI5IiwiYSI6ImNrZ3Q4Ym9mMDBqMGYyeXFvODV2dWl6YzQifQ.gSKoWF-fMjhzU67TuDezJQ';
const MUNICIPALITY_CITIES_ARR = [
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  '香港特别行政区',
  '澳门特别行政区',
];
const MAP_LAYER_LIST = [
  'road-label',
  'waterway-label',
  'natural-line-label',
  'natural-point-label',
  'water-line-label',
  'water-point-label',
  'poi-label',
  'airport-label',
  'settlement-subdivision-label',
  'settlement-label',
  'state-label',
  'country-label',
];

// styling: set to `true` if you want dash-line route
const USE_DASH_LINE = false;
// styling: route line opacity: [0, 1]
const LINE_OPACITY = 0.72;
// styling: map height. Keep the homepage close to the reference layout.
const MAP_HEIGHT = 320;
//set to `false` if you want to hide the road label characters
const ROAD_LABEL_DISPLAY = true;
// updated on 2024/11/17: privacy mode is set to true by default
//set to `true` if you want to display only the routes without showing the map.
const PRIVACY_MODE = false;
// updated on 2024/11/17: lights are turned off by default
//set to `false` if you want to make light off as default, only effect when `PRIVACY_MODE` = false
const LIGHTS_ON = false;
//set to `true` if you want to show the 'Elevation Gain' column
const SHOW_ELEVATION_GAIN = true;
// richer title for the activity types (like garmin style)
const RICH_TITLE = true;

// IF you are outside China please make sure IS_CHINESE = false
const IS_CHINESE = false;
const USE_ANIMATION_FOR_GRID = false;
// English is not supported for location info messages yet
const CHINESE_LOCATION_INFO_MESSAGE_FIRST =
  'This archive records places reached through outdoor activity';
const CHINESE_LOCATION_INFO_MESSAGE_SECOND = 'Keep moving and keep exploring';
const FULL_MARATHON_RUN_TITLE = 'Full Marathon';
const HALF_MARATHON_RUN_TITLE = 'Half Marathon';
const RUN_TITLE = 'Run';
const TRAIL_RUN_TITLE = 'Trail Run';
const SWIM_TITLE = 'Swim';
const RIDE_TITLE = 'Ride';
const INDOOR_RIDE_TITLE = 'Indoor Ride';
const VIRTUAL_RIDE_TITLE = 'Virtual Ride';
const HIKE_TITLE = 'Hike';
const ROWING_TITLE = 'Rowing';
const KAYAKING_TITLE = 'Kayaking';
const SNOWBOARD_TITLE = 'Snowboard';
const SKI_TITLE = 'Ski';
const BACKCOUNTRY_SKI_TITLE = 'BackcountrySki';
const ROAD_TRIP_TITLE = 'RoadTrip';
const FLIGHT_TITLE = 'Flight';
const RUN_TREADMILL_TITLE = 'Treadmill Run';
const ALL_TITLE = 'All';
const ACTIVITY_COUNT_TITLE = 'Activity Count';
const MAX_DISTANCE_TITLE = 'Max Distance';
const MAX_SPEED_TITLE = 'Max Speed';
const TOTAL_TIME_TITLE = 'Total Time';
const AVERAGE_SPEED_TITLE = 'Average Speed';
const TOTAL_DISTANCE_TITLE = 'Total Distance';
const AVERAGE_DISTANCE_TITLE = 'Average Distance';
const TOTAL_ELEVATION_GAIN_TITLE = 'Total Elevation Gain';
const AVERAGE_HEART_RATE_TITLE = 'Average Heart Rate';
const YEARLY_TITLE = 'Yearly';
const MONTHLY_TITLE = 'Monthly';
const WEEKLY_TITLE = 'Weekly';
const DAILY_TITLE = 'Daily';
const LOCATION_TITLE = 'Location';
const HOME_PAGE_TITLE = 'Home';

const LOADING_TEXT = 'Loading...';
const NO_ROUTE_DATA = 'No route data';
const INVALID_ROUTE_DATA = 'Invalid route data';

const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  RUN_TITLE,
  TRAIL_RUN_TITLE,

  SWIM_TITLE,
  RIDE_TITLE,
  INDOOR_RIDE_TITLE,
  VIRTUAL_RIDE_TITLE,
  HIKE_TITLE,
  ROWING_TITLE,
  KAYAKING_TITLE,
  SNOWBOARD_TITLE,
  SKI_TITLE,
  BACKCOUNTRY_SKI_TITLE,
  ROAD_TRIP_TITLE,
  FLIGHT_TITLE,
  RUN_TREADMILL_TITLE,
  ALL_TITLE,
};

const TYPES_MAPPING = {
  Run: RUN_TITLES.RUN_TITLE,
  'Trail Run': RUN_TITLES.TRAIL_RUN_TITLE,
  Swim: RUN_TITLES.SWIM_TITLE,
  Ride: RUN_TITLES.RIDE_TITLE,
  VirtualRide: RUN_TITLES.VIRTUAL_RIDE_TITLE,
  'Indoor Ride': RUN_TITLES.INDOOR_RIDE_TITLE,
  Hike: RUN_TITLES.HIKE_TITLE,
  Rowing: RUN_TITLES.ROWING_TITLE,
  Kayaking: RUN_TITLES.KAYAKING_TITLE,
  Snowboard: RUN_TITLES.SNOWBOARD_TITLE,
  Ski: RUN_TITLES.SKI_TITLE,
  RoadTrip: RUN_TITLES.ROAD_TRIP_TITLE,
  Flight: RUN_TITLES.FLIGHT_TITLE,
  'Treadmill Run': RUN_TITLES.RUN_TREADMILL_TITLE,
  all: RUN_TITLES.ALL_TITLE,
};

const ACTIVITY_TOTAL = {
  ACTIVITY_COUNT_TITLE,
  MAX_DISTANCE_TITLE,
  MAX_SPEED_TITLE,
  TOTAL_TIME_TITLE,
  AVERAGE_SPEED_TITLE,
  TOTAL_DISTANCE_TITLE,
  AVERAGE_DISTANCE_TITLE,
  TOTAL_ELEVATION_GAIN_TITLE,
  AVERAGE_HEART_RATE_TITLE,
  YEARLY_TITLE,
  MONTHLY_TITLE,
  WEEKLY_TITLE,
  DAILY_TITLE,
  LOCATION_TITLE,
};

export {
  CHINESE_LOCATION_INFO_MESSAGE_FIRST,
  CHINESE_LOCATION_INFO_MESSAGE_SECOND,
  MAPBOX_TOKEN,
  MUNICIPALITY_CITIES_ARR,
  MAP_LAYER_LIST,
  IS_CHINESE,
  ROAD_LABEL_DISPLAY,
  RUN_TITLES,
  USE_ANIMATION_FOR_GRID,
  USE_DASH_LINE,
  LINE_OPACITY,
  MAP_HEIGHT,
  PRIVACY_MODE,
  LIGHTS_ON,
  SHOW_ELEVATION_GAIN,
  RICH_TITLE,
  ACTIVITY_TOTAL,
  TYPES_MAPPING,
  HOME_PAGE_TITLE,
  LOADING_TEXT,
  NO_ROUTE_DATA,
  INVALID_ROUTE_DATA,
};

const nike = 'rgb(224,237,94)'; // if you want to change the main color, modify this value in src/styles/variables.scss
const yellow = 'rgb(224,237,94)';
const yellow_compl = 'rgb(106, 94, 237)';
const green = 'rgb(0,237,94)';
const pink = 'rgb(237,85,219)';
const cyan = 'rgb(112,243,255)';
const IKB = 'rgb(0,47,167)';
const dark_vanilla = 'rgb(228,212,220)';
const gold = 'rgb(242,190,69)';
const purple = 'rgb(154,118,252)';
const purple2 = 'rgb(127, 34, 254)';
const veryPeri = 'rgb(105,106,173)'; //长春花蓝
const red = 'rgb(255,0,0)'; //大红色

// If your map has an offset please change this line
// issues #92 and #198
export const NEED_FIX_MAP = false;
export const MAIN_COLOR = 'rgb(224,237,94)';
export const MAIN_COLOR_LIGHT = 'rgb(224,237,94)';

// Static color constants
export const RUN_COLOR_LIGHT = 'rgb(224,237,94)';
export const RUN_COLOR_DARK = MAIN_COLOR;

// Single run animation colors
export const SINGLE_RUN_COLOR_LIGHT = 'rgb(224,237,94)';
export const SINGLE_RUN_COLOR_DARK = 'rgb(224,237,94)';

// Helper function to get theme-aware SINGLE_RUN_COLOR
export const getRuntimeSingleColor = (
  typeColor: string[] = [MAIN_COLOR, MAIN_COLOR_LIGHT]
): string => {
  if (typeof window === 'undefined') return SINGLE_RUN_COLOR_DARK;

  const dataTheme = document.documentElement.getAttribute('data-theme');
  const savedTheme = localStorage.getItem('theme');

  const isDark = dataTheme === 'dark' || (!dataTheme && savedTheme === 'dark');

  return isDark ? typeColor[0] : typeColor[1];
};

// Legacy export for backwards compatibility
export const RUN_COLOR = ['rgb(224,237,94)', 'rgb(224,237,94)'];
export const RIDE_COLOR = ['rgb(205,240,82)', 'rgb(205,240,82)'];
export const VIRTUAL_RIDE_COLOR = ['rgb(184,232,92)', 'rgb(184,232,92)'];
export const HIKE_COLOR = ['rgb(178,238,124)', 'rgb(178,238,124)'];
export const SWIM_COLOR = ['rgb(190,244,150)', 'rgb(190,244,150)'];
export const ROWING_COLOR = ['rgb(196,236,118)', 'rgb(196,236,118)'];
export const ROAD_TRIP_COLOR = ['rgb(238,244,130)', 'rgb(238,244,130)'];
export const FLIGHT_COLOR = ['rgb(228,212,220)', 'rgb(228,212,220)'];
export const KAYAKING_COLOR = ['rgb(236,225,104)', 'rgb(236,225,104)'];
export const SNOWBOARD_COLOR = ['rgb(210,236,128)', 'rgb(210,236,128)'];
export const TRAIL_RUN_COLOR = ['rgb(238,244,80)', 'rgb(238,244,80)'];
export const PROVINCE_FILL_COLOR = '#334155';
export const COUNTRY_FILL_COLOR = '#475569';
export const INDOOR_COLOR = '#8899aa';

// map tiles vendor, maptiler or mapbox or stadiamaps
// if you want to use maptiler, set the access token in MAP_TILE_ACCESS_TOKEN
export const MAP_TILE_VENDOR = 'mapcn';

// map tiles style name, see MAP_TILE_STYLES for more details
export const MAP_TILE_STYLE_LIGHT = 'dark-matter';
export const MAP_TILE_STYLE_DARK = 'dark-matter';

// access token. you can apply a new one, it's free.
// maptiler: Gt5R0jT8tuIYxW6sNrAg | sign up at https://cloud.maptiler.com/auth/widget
// stadiamaps: 8a769c5a-9125-4936-bdcf-a6b90cb5d0a4 | sign up at https://client.stadiamaps.com/signup/
// mapcn: empty
export const MAP_TILE_ACCESS_TOKEN = '';

export const MAP_TILE_STYLES = {
  mapcn: {
    'osm-bright':
      'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    'osm-liberty':
      'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    'dark-matter':
      'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  // Alternative free tile providers for regions where Carto may be blocked
  mapcn_openfreemap: {
    'osm-bright': 'https://tiles.openfreemap.org/styles/bright',
    'dark-matter': 'https://tiles.openfreemap.org/styles/dark',
  },
  mapcn_maptiler_free: {
    // Use free, tokenless styles to avoid requiring an API key
    'osm-bright': 'https://tiles.openfreemap.org/styles/bright',
    'dark-matter': 'https://tiles.openfreemap.org/styles/dark',
  },
  maptiler: {
    'dataviz-light': 'https://api.maptiler.com/maps/dataviz/style.json?key=',
    'dataviz-dark':
      'https://api.maptiler.com/maps/dataviz-dark/style.json?key=',
    'basic-light': 'https://api.maptiler.com/maps/basic-v2/style.json?key=',
    'basic-dark': 'https://api.maptiler.com/maps/basic-v2-dark/style.json?key=',
    'streets-light': 'https://api.maptiler.com/maps/streets-v2/style.json?key=',
    'streets-dark':
      'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=',
    'outdoor-light': 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=',
    'outdoor-dark':
      'https://api.maptiler.com/maps/outdoor-v2-dark/style.json?key=',
    'bright-light': 'https://api.maptiler.com/maps/bright-v2/style.json?key=',
    'bright-dark':
      'https://api.maptiler.com/maps/bright-v2-dark/style.json?key=',
    'topo-light': 'https://api.maptiler.com/maps/topo-v2/style.json?key=',
    'topo-dark': 'https://api.maptiler.com/maps/topo-v2-dark/style.json?key=',
    'winter-light': 'https://api.maptiler.com/maps/winter-v2/style.json?key=',
    'winter-dark':
      'https://api.maptiler.com/maps/winter-v2-dark/style.json?key=',
    hybrid: 'https://api.maptiler.com/maps/hybrid/style.json?key=',
  },

  // https://docs.stadiamaps.com/themes/
  stadiamaps: {
    // light
    alidade_smooth:
      'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=',
    alidade_smooth_dark:
      'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=',
    alidade_satellite:
      'https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=',
  },

  // https://docs.mapbox.com/api/maps/styles/
  mapbox: {
    'dark-v10': 'mapbox://styles/mapbox/dark-v10',
    'dark-v11': 'mapbox://styles/mapbox/dark-v11',
    'light-v10': 'mapbox://styles/mapbox/light-v10',
    'light-v11': 'mapbox://styles/mapbox/light-v11',
    'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
    'satellite-streets-v12': 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  default: 'mapbox://styles/mapbox/dark-v10',
};

export const getMapTileVendorStyles = (
  vendor: string
): Record<string, string> | undefined => {
  const styles = MAP_TILE_STYLES[vendor as keyof typeof MAP_TILE_STYLES];
  return typeof styles === 'object' ? styles : undefined;
};

// Configuration validation
if (typeof window !== 'undefined') {
  // Validate token requirements
  if (MAP_TILE_VENDOR === 'mapcn' && MAP_TILE_ACCESS_TOKEN !== '') {
    console.warn(
      '⚠️ MapCN (Carto) does not require an access token.\n' +
        '💡 You can set MAP_TILE_ACCESS_TOKEN = "" in src/utils/const.ts'
    );
  }

  if (
    ['mapbox', 'maptiler', 'stadiamaps'].includes(MAP_TILE_VENDOR) &&
    MAP_TILE_ACCESS_TOKEN === ''
  ) {
    console.error(
      `❌ ${MAP_TILE_VENDOR.toUpperCase()} requires an access token!\n` +
        `💡 Please set MAP_TILE_ACCESS_TOKEN in src/utils/const.ts\n` +
        `📚 See README.md for instructions on getting a token.\n` +
        `\n` +
        `💡 TIP: Use MAP_TILE_VENDOR = 'mapcn' for free (no token required)`
    );
  }

  // Validate style matches vendor
  const vendorStyles = getMapTileVendorStyles(MAP_TILE_VENDOR);
  if (vendorStyles && !vendorStyles[MAP_TILE_STYLE_LIGHT]) {
    console.error(
      `❌ Style "${MAP_TILE_STYLE_LIGHT}" is not valid for vendor "${MAP_TILE_VENDOR}"\n` +
        `💡 Available styles: ${Object.keys(vendorStyles).join(', ')}\n` +
        `📚 Check src/utils/const.ts MAP_TILE_STYLES for valid combinations`
    );
  }

  // Success message for correct MapCN configuration
  if (
    MAP_TILE_VENDOR === 'mapcn' &&
    MAP_TILE_ACCESS_TOKEN === '' &&
    vendorStyles?.[MAP_TILE_STYLE_LIGHT]
  ) {
    console.info(
      '✅ Using MapCN (Carto Basemaps) - Free, no token required!\n' +
        '📖 Attribution: Map tiles © CARTO, Map data © OpenStreetMap contributors\n' +
        '📚 See docs/CARTO_TERMS.md for usage terms'
    );
  }
}
