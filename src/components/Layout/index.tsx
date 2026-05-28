import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const Layout = ({ children }: React.PropsWithChildren) => {
  const { siteTitle, description, keywords } = getSiteMetadata();
  const designWidth = 1280;
  const contentRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ height: 0, scale: 1 });

  useEffect(() => {
    let frameId = 0;
    const updateFrame = () => {
      const nextScale = Math.min(1, window.innerWidth / designWidth);
      const contentHeight = contentRef.current?.scrollHeight ?? 0;
      setFrame({
        height: contentHeight * nextScale,
        scale: nextScale,
      });
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateFrame);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleUpdate)
        : null;
    if (contentRef.current && observer) {
      observer.observe(contentRef.current);
    }
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleUpdate);
      observer?.disconnect();
    };
  }, []);

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
        className="w-full overflow-x-hidden"
        style={{ height: frame.height ? `${frame.height}px` : undefined }}
      >
        <div
          className="mb-16 box-border flex gap-8 p-8"
          ref={contentRef}
          style={{
            transform: `scale(${frame.scale})`,
            transformOrigin: 'top left',
            width: `${designWidth}px`,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default Layout;
