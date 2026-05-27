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
  siteTitle: 'CLEOPAS Strava Page',
  siteUrl: 'https://cleopas-strava.vercel.app/',
  logo: 'https://github.com/shuncleopasfang.png',
  description: 'Cleopas Fang Strava activity archive and visualization',
  navLinks: [],
};

export default data;
