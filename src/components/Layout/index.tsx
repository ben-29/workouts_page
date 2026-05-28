import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const DESIGN_WIDTH = 1280;

const Layout = ({ children }: React.PropsWithChildren) => {
  const { siteTitle, description, keywords } = getSiteMetadata();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

  useEffect(() => {
    let frameId = 0;
    const measure = () => {
      const nextScale = Math.min(1, window.innerWidth / DESIGN_WIDTH);
      setScale(nextScale);
      setCanvasHeight(canvasRef.current?.scrollHeight ?? null);
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  const isScaled = scale < 1;

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
      <div className="w-full overflow-x-hidden">
        <div
          style={{
            height:
              isScaled && canvasHeight ? `${canvasHeight * scale}px` : 'auto',
          }}
        >
          <div
            className="mb-16 flex w-[1280px] max-w-none origin-top-left flex-row gap-8 p-8"
            ref={canvasRef}
            style={{
              transform: isScaled ? `scale(${scale})` : undefined,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
