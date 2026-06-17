'use client';

import { useEffect } from 'react';
import { useJobStore } from '@/store/store';

export default function PWARegister() {
  const setOnline = useJobStore((state) => state.setOnline);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('ServiceWorker registration successful with scope: ', reg.scope))
          .catch((err) => console.warn('ServiceWorker registration failed: ', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        cleanup = () => window.removeEventListener('load', registerSW);
      }
    }

    // Monitor Online/Offline Status
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof window !== 'undefined') {
      setOnline(window.navigator.onLine);
    }

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return null;
}
