import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const Layout = ({ children }: React.PropsWithChildren) => {
  const { siteTitle, description, keywords } = getSiteMetadata();

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{siteTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta
          name="viewport"
          content="width=1280, initial-scale=1, shrink-to-fit=no"
        />
      </Helmet>
      <Header />
      <div className="mb-16 flex w-full max-w-none flex-row gap-8 p-8">
        {children}
      </div>
    </>
  );
};

export default Layout;
