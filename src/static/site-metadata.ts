interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Cleopas Strava',
  siteUrl: 'https://cleopas-strava.vercel.app/',
  logo: '',
  description: 'A personal Strava activity archive and route visualization.',
  navLinks: [],
};

export default data;
