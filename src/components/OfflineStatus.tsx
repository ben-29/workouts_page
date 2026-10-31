import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function OfflineStatus() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);
  const language = navigator.languages?.[0] || navigator.language;
  const chinese = /^zh(?:-|$)/i.test(language);
  useRegisterSW({
    onRegisteredSW(_url, value) {
      setRegistration(value);
    },
    onRegisterError(error) {
      console.warn('Offline cache registration failed:', error);
    },
  });

  useEffect(() => {
    let lastCheck = 0;
    const check = () => {
      if (!navigator.onLine || document.visibilityState !== 'visible') return;
      if (
        !registration ||
        registration.installing ||
        Date.now() - lastCheck < 60_000
      )
        return;
      lastCheck = Date.now();
      void registration.update().catch(() => {
        // A failed check must leave the working offline version intact.
      });
    };
    const online = () => {
      setOffline(false);
      setVisible(false);
      check();
    };
    const disconnected = () => {
      setOffline(true);
      setVisible(true);
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', disconnected);
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 60 * 60 * 1000);
    check();
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', disconnected);
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(timer);
    };
  }, [registration]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 10_000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!offline || !visible) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      lang={chinese ? 'zh' : 'en'}
      className="offline-notice"
    >
      <span className="offline-notice-dot" aria-hidden="true" />
      <p>
        {chinese
          ? '当前离线，正在使用本地数据。地图底图可能无法显示。'
          : 'You are offline, using local data. The base map may be unavailable.'}
      </p>
    </aside>
  );
}
