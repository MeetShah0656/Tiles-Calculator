'use client';

import { useEffect } from 'react';
import { useJobStore } from '@/store/store';

export default function PWARegister() {
  const setIsOnline = useJobStore((state) => state.setIsOnline);

  useEffect(() => {
    let cleanup;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
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
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    }

    const handleOnline = () => {
      if (typeof setIsOnline === 'function') {
        setIsOnline(true);
      }
    };
    
    const handleOffline = () => {
      if (typeof setIsOnline === 'function') {
        setIsOnline(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof window !== 'undefined' && typeof setIsOnline === 'function') {
      setIsOnline(window.navigator.onLine);
    }

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return null;
}
