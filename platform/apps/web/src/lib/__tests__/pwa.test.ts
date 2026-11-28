import fs from 'fs';
import path from 'path';
import {
  isCacheableApiPath,
  PRECACHE_PATHS,
  registerServiceWorker,
  SERVICE_WORKER_PATH,
} from '../pwa';

const publicDir = path.join(__dirname, '../../../public');

describe('service worker registration (T-5027)', () => {
  it('registers the worker path and reports success', async () => {
    const register = jest.fn().mockResolvedValue({});
    await expect(registerServiceWorker({ register }, { force: true })).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_PATH);
  });

  it('never throws when registration fails or no container exists', async () => {
    const register = jest.fn().mockRejectedValue(new Error('blocked'));
    await expect(registerServiceWorker({ register }, { force: true })).resolves.toBe(false);
    await expect(registerServiceWorker(undefined, { force: true })).resolves.toBe(false);
  });

  it('only caches public catalog GET paths', () => {
    expect(isCacheableApiPath('/booking/services/loc-1')).toBe(true);
    expect(isCacheableApiPath('/booking/barbers/loc-1')).toBe(true);
    expect(isCacheableApiPath('/locations/nearest')).toBe(true);
    expect(isCacheableApiPath('/booking/bookings')).toBe(false);
    expect(isCacheableApiPath('/identity/session')).toBe(false);
  });
});

describe('PWA assets (T-5027)', () => {
  it('ships an installable manifest with icons and booking shortcuts', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8')
    ) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      icons: { src: string; purpose?: string }[];
      shortcuts: { url: string }[];
    };

    expect(manifest.name).toContain('Fade');
    expect(manifest.short_name).toBe('Fade');
    expect(manifest.start_url).toBe('/booking');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.purpose)).toEqual(
      expect.arrayContaining(['any', 'maskable'])
    );
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual(
      expect.arrayContaining(['/booking', '/barbers'])
    );
    for (const icon of manifest.icons) {
      expect(fs.existsSync(path.join(publicDir, icon.src.replace(/^\//, '')))).toBe(true);
    }
  });

  it('precaches the app shell and falls back to the offline page', () => {
    expect(PRECACHE_PATHS).toEqual(
      expect.arrayContaining(['/', '/booking', '/offline', '/manifest.webmanifest'])
    );
    const source = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
    expect(source).toContain("const CACHE = 'fade-pwa-v1'");
    expect(source).toContain("request.mode === 'navigate'");
    expect(source).toContain("const OFFLINE = '/offline'");
    expect(source).toContain('/_next/static/');
    expect(source).toContain("request.method !== 'GET'");
  });
});
