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
  siteTitle: 'Workouts map of shog',
  siteUrl: 'https://www.linkedin.com/in/gezhongjun/',
  logo: 'https://media.licdn.com/dms/image/C4D03AQEscF8G9GIO9g/profile-displayphoto-shrink_400_400/0/1593513985221?e=1723680000&v=beta&t=oCibi9MKlBtP6_A9s6UvFQbcOd50UMnH7UIdLQvR94Y',
  description: '',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: 'About',
      url: 'https://www.linkedin.com/in/gezhongjun/',
    },
  ],
};

export default data;
