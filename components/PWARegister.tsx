'use client';

import { useEffect } from 'react';
import { useJobStore } from '@/store/store';

export default function PWARegister() {
  const setOnline = useJobStore((state) => state.setOnline);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('ServiceWorker registration successful with scope: ', reg.scope))
          .catch((err) => console.warn('ServiceWorker registration failed: ', err));
      });
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
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return null;
}
