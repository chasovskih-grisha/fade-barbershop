'use client';

// Registers the service worker once per page load (T-5027). Kept client-only so
// the server layout stays static; registration is a no-op outside production.
import { useEffect } from 'react';
import { registerServiceWorker, type ServiceWorkerContainerLike } from '@/lib/pwa';

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    void registerServiceWorker(navigator.serviceWorker as ServiceWorkerContainerLike);
  }, []);
  return null;
}
