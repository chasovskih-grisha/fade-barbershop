// Метадані читають NEXT_PUBLIC_SITE_URL під час імпорту модуля, тому кожен кейс
// ізольований через resetModules + динамічний import.
const loadPageMetadata = async (siteUrl?: string) => {
  if (siteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  jest.resetModules();
  const mod = await import('../metadata');
  return mod.pageMetadata;
};

describe('pageMetadata', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it('будує title/description з дефолтним описом', async () => {
    const pageMetadata = await loadPageMetadata('https://fade.com.ua');
    const meta = pageMetadata({ title: 'Послуги' });
    expect(meta.title).toBe('Послуги');
    expect(meta.description).toBeTruthy();
    expect(meta.robots).toBeUndefined();
  });

  it('проставляє канонічний URL і OG з конфігурації', async () => {
    const pageMetadata = await loadPageMetadata('https://fade.com.ua');
    const meta = pageMetadata({ title: 'Локації', path: '/locations' });
    expect(meta.alternates?.canonical).toBe('https://fade.com.ua/locations');
    expect(meta.openGraph?.url).toBe('https://fade.com.ua/locations');
    expect(meta.openGraph?.locale).toBe('uk_UA');
  });

  it('не виставляє канонічний URL без конфігурації (dev)', async () => {
    const pageMetadata = await loadPageMetadata();
    const meta = pageMetadata({ title: 'Локації', path: '/locations' });
    expect(meta.alternates).toBeUndefined();
    expect(meta.title).toBe('Локації');
  });

  it('закриває приватні сторінки від індексації', async () => {
    const pageMetadata = await loadPageMetadata('https://fade.com.ua');
    const meta = pageMetadata({ title: 'Кабінет', noIndex: true });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('прибирає слеш у кінці хоста, щоб канонік не мав подвоєнь', async () => {
    const pageMetadata = await loadPageMetadata('https://fade.com.ua/');
    const meta = pageMetadata({ title: 'Головна', path: '/' });
    expect(meta.alternates?.canonical).toBe('https://fade.com.ua/');
  });
});
