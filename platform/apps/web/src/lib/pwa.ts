// PWA plumbing (T-5027): manifest/service-worker paths, safe registration and
// the API paths whose GET responses may be served from the offline shell cache.

export const SERVICE_WORKER_PATH = '/sw.js';
export const OFFLINE_PATH = '/offline';
export const PWA_CACHE_PREFIX = 'fade-pwa';

/** App shell precached on service-worker install. */
export const PRECACHE_PATHS = ['/', '/booking', OFFLINE_PATH, '/manifest.webmanifest'] as const;

export interface ServiceWorkerContainerLike {
  register(scriptUrl: string): Promise<unknown>;
}

export interface RegisterServiceWorkerOptions {
  /** Test hook: register even outside a production build. */
  force?: boolean;
}

/**
 * Registers the service worker in production builds. Registration failure must
 * never break the page, so errors are swallowed and reported as `false`.
 */
export async function registerServiceWorker(
  container: ServiceWorkerContainerLike | undefined,
  options: RegisterServiceWorkerOptions = {}
): Promise<boolean> {
  if (!container) return false;
  if (!options.force && process.env.NODE_ENV !== 'production') return false;
  try {
    await container.register(SERVICE_WORKER_PATH);
    return true;
  } catch {
    return false;
  }
}

/** GET endpoints safe to cache: public catalog reads that change rarely. */
export function isCacheableApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/booking/services/') ||
    pathname.startsWith('/booking/barbers/') ||
    pathname.startsWith('/locations/')
  );
}
