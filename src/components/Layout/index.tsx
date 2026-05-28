import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const DESIGN_WIDTH = 1280;

const Layout = ({ children }: React.PropsWithChildren) => {
  const { siteTitle, description, keywords } = getSiteMetadata();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let frameId = 0;
    const updateScale = () => {
      setScale(Math.min(1, window.innerWidth / DESIGN_WIDTH));
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateScale);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  const isScaled = scale < 1;
  const canvasStyle = {
    width: isScaled ? `${DESIGN_WIDTH}px` : '100%',
    zoom: isScaled ? scale : undefined,
  } as React.CSSProperties & { zoom?: number };

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{siteTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Helmet>
      <Header />
      <div
        className="mb-16 flex max-w-none flex-row gap-8 p-8"
        style={canvasStyle}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;
