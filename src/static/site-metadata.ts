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
  siteUrl: 'https://fengsy.cn',
  logo: 'https://pan.4a1801.life:11443/d/public/logo1.jpg',
  description: 'Personal site and blog',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: '家庭博客',
      url: 'https://fengsy.cn',
    },
    {
      name: '关于我们',
      url: 'https://fengsy.cn/%E5%AE%B6%E5%BA%AD/intro.html',
    },
  ],
};

export default data;
