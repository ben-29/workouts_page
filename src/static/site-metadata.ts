interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  keywords: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl === '/' ? '' : baseUrl;
};

const data: ISiteMetadataResult = {
  siteTitle: 'Cleopas Workouts',
  siteUrl: 'https://workouts.shuncleopasfang.com',
  logo: 'https://avatars.githubusercontent.com/u/52828963',
  description: 'Cleopas Fang workout map powered by Strava',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: 'Summary',
      url: `${getBasePath()}/summary`,
    },
    {
      name: 'Strava',
      url: 'https://www.strava.com/athletes/125003460',
    },
    {
      name: 'About',
      url: 'https://github.com/shuncleopasfang/strava',
    },
  ],
};

export default data;
