interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  keywords: string;
  navLinks: [];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Cleopas Strava',
  siteUrl: 'https://cleopas-strava.vercel.app',
  description: 'Cleopas Fang Strava activity archive and visualization',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [],
};

export default data;
