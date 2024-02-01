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

const data: ISiteMetadataResult = {
  siteTitle: 'Feng Siyuan锻炼记录',
  siteUrl: 'https://blog.4a1801.life',
  logo: 'https://pan.4a1801.life/d/Onedrive-4A1801/%E4%B8%AA%E4%BA%BA%E5%BB%BA%E7%AB%99/public/logo1.jpg',
  description: 'Personal site and blog',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: 'Blog',
      url: 'https://blog.4a1801.life',
    },
    {
      name: 'About',
      url: 'https://blog.4a1801.life/%E5%AE%B6%E5%BA%AD/intro.html',
    },
  ],
};

export default data;
