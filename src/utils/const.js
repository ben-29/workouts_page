// const
const MAPBOX_TOKEN =
    'pk.eyJ1IjoiYmVuLTI5IiwiYSI6ImNrZ3Q4Ym9mMDBqMGYyeXFvODV2dWl6YzQifQ.gSKoWF-fMjhzU67TuDezJQ';
const MUNICIPALITY_CITIES_ARR = [
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  '香港特别行政区',
  '澳门特别行政区',
];

// IF you outside China please make sure IS_CHINESE = false
const IS_CHINESE = true;
const USE_ANIMATION_FOR_GRID = false;
const CHINESE_INFO_MESSAGE = (yearLength, year) =>
  `App/手表 记录自己户外运动 ${yearLength} 年了，下面列表展示的是 ${year} 的数据`;
const ENGLISH_INFO_MESSAGE = (yearLength, year) =>
  `Outdoor Workouts Journey in ${yearLength} Years, the table shows year ${year} data`;

const INFO_MESSAGE = IS_CHINESE ? CHINESE_INFO_MESSAGE : ENGLISH_INFO_MESSAGE;
const FULL_MARATHON_RUN_TITLE = IS_CHINESE ? '全程马拉松' : 'Full Marathon';
const HALF_MARATHON_RUN_TITLE = IS_CHINESE ? '半程马拉松' : 'Half Marathon';
const RUN_TITLE = IS_CHINESE ? '跑步' : 'Run';
const SWIM_TITLE = IS_CHINESE ? '游泳' : 'Swim';

const RIDE_TITLE = IS_CHINESE ? '骑行' : 'Ride';
const INDOOR_RIDE_TITLE = IS_CHINESE ? '室内骑行' : 'Indoor Ride';
const HIKE_TITLE = IS_CHINESE ? '徒步' : 'Hike';
const ROWING_TITLE = IS_CHINESE ? '划船' : 'Rowing';

const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  RUN_TITLE,

  RIDE_TITLE,
  INDOOR_RIDE_TITLE,
  HIKE_TITLE,
  ROWING_TITLE,
  SWIM_TITLE,
};

export {
  MAPBOX_TOKEN,
  MUNICIPALITY_CITIES_ARR,
  IS_CHINESE,
  INFO_MESSAGE,
  RUN_TITLES,
  USE_ANIMATION_FOR_GRID,
};

export const AVATAR =
  'https://avatars3.githubusercontent.com/u/6956444?s=460&u=97e1062227c4088db3c987146455245c6fa78441&v=4'; // Temp avatar
export const NAVS = [
  { text: 'Blog', link: 'https://ben29.xyz' },
  { text: 'About', link: 'https://ben29.xyz/about' },
];

const nike = 'rgb(224,237,94)';
const yellow = 'rgb(224,237,94)';
const green = 'rgb(0,237,94)';
const pink = 'rgb(237,85,219)';
const cyan = 'rgb(112,243,255)';
const gold = 'rgb(242,190,69)';
export const MAIN_COLOR = yellow;
export const RIDE_COLOR = green;
export const HIKE_COLOR = pink;
export const SWIM_COLOR = gold;
export const ROWING_COLOR = cyan;
export const PROVINCE_FILL_COLOR = '#47b8e0';
