import ActivityList from '@/components/ActivityList';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

const HomePage = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <>
      <Helmet>
        <html lang="en" data-theme="light" />
      </Helmet>
      <ActivityList />
    </>
  );
};

export default HomePage;
