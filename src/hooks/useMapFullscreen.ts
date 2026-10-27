import { useCallback, useEffect, useRef, useState } from 'react';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

// Native fullscreen is unavailable in some mobile browsers and embedded webviews.
// Keep the control usable by falling back to a viewport-sized map.
export default function useMapFullscreen(onResize: () => void) {
  const containerRef = useRef<FullscreenElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(false);
  const pendingRef = useRef(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const isFullscreen = nativeFullscreen || fallbackFullscreen;

  useEffect(() => {
    mountedRef.current = true;
    const doc = document as FullscreenDocument;
    const syncFullscreen = () => {
      setNativeFullscreen(
        (doc.fullscreenElement || doc.webkitFullscreenElement) ===
          containerRef.current
      );
      onResize();
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    const observer = new ResizeObserver(onResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      mountedRef.current = false;
      observer.disconnect();
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, [onResize]);

  useEffect(() => {
    if (!fallbackFullscreen) return;

    // Fixed-body scroll locking also works on iOS; restore the original position
    // and styles on exit and when navigating away from the map.
    const body = document.body;
    const root = document.documentElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const properties = [
      'position',
      'top',
      'left',
      'width',
      'overflow',
    ] as const;
    const saved = properties.map((property) => ({
      property,
      value: body.style.getPropertyValue(property),
      priority: body.style.getPropertyPriority(property),
    }));
    const rootOverflow = root.style.overflow;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFallbackFullscreen(false);
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      for (const { property, value, priority } of saved) {
        if (value) body.style.setProperty(property, value, priority);
        else body.style.removeProperty(property);
      }
      root.style.overflow = rootOverflow;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    };
  }, [fallbackFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container || pendingRef.current) return;
    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }

    const doc = document as FullscreenDocument;
    pendingRef.current = true;
    try {
      if (
        (doc.fullscreenElement || doc.webkitFullscreenElement) === container
      ) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else await doc.webkitExitFullscreen?.();
      } else {
        try {
          if (container.requestFullscreen && doc.fullscreenEnabled) {
            await container.requestFullscreen();
          } else if (
            container.webkitRequestFullscreen &&
            doc.webkitFullscreenEnabled
          ) {
            await container.webkitRequestFullscreen();
          } else {
            setFallbackFullscreen(true);
          }
        } catch {
          // Some webviews expose the API but reject the request.
          if (mountedRef.current) setFallbackFullscreen(true);
        }
      }
    } catch (error) {
      console.warn('Unable to exit map fullscreen:', error);
    } finally {
      pendingRef.current = false;
    }
  }, [fallbackFullscreen]);

  return {
    containerRef,
    buttonRef,
    isFullscreen,
    fallbackFullscreen,
    toggleFullscreen,
  };
}
