import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const DESIGN_WIDTH = 1280;

const Layout = ({ children }: React.PropsWithChildren) => {
  const { siteTitle, description, keywords } = getSiteMetadata();
  const outerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isScaled || !window.visualViewport || window.innerWidth > 768) {
      return;
    }

    let frameId = 0;
    const tolerance = 2;
    const keepViewportInsideContent = () => {
      const outer = outerRef.current;
      const visualViewport = window.visualViewport;
      if (!outer || !visualViewport) return;

      const rect = outer.getBoundingClientRect();
      const contentLeft = rect.left + window.scrollX;
      const contentRight = contentLeft + rect.width;
      const viewportLeft = visualViewport.pageLeft;
      const viewportRight = viewportLeft + visualViewport.width;
      let nextX = window.scrollX;

      if (viewportLeft < contentLeft - tolerance) {
        nextX += viewportLeft - contentLeft;
      } else if (viewportRight > contentRight + tolerance) {
        nextX += viewportRight - contentRight;
      } else {
        return;
      }

      window.scrollTo({
        behavior: 'auto',
        left: Math.max(0, nextX),
        top: window.scrollY,
      });
    };
    const scheduleCorrection = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(keepViewportInsideContent);
    };

    window.visualViewport.addEventListener('resize', scheduleCorrection);
    window.visualViewport.addEventListener('scroll', scheduleCorrection);
    window.addEventListener('scroll', scheduleCorrection, { passive: true });
    scheduleCorrection();
    return () => {
      cancelAnimationFrame(frameId);
      window.visualViewport?.removeEventListener('resize', scheduleCorrection);
      window.visualViewport?.removeEventListener('scroll', scheduleCorrection);
      window.removeEventListener('scroll', scheduleCorrection);
    };
  }, [isScaled]);

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
      <div className="w-full overflow-x-hidden" ref={outerRef}>
        <div
          ref={spacerRef}
          style={{
            height:
              isScaled && canvasHeight ? `${canvasHeight * scale}px` : 'auto',
          }}
        >
          <div
            className="mb-16 flex max-w-none origin-top-left flex-row gap-8 p-8"
            ref={canvasRef}
            style={{
              width: isScaled ? `${DESIGN_WIDTH}px` : '100%',
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
