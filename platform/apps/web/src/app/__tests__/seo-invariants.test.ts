// T-2600a (технічний SEO): автоматична перевірка інваріантів robots і sitemap.
// Мета — гейт, що ловить регресії без ручного огляду: приватні шляхи закриті,
// канонічний хост один, sitemap не містить подвійних слешів і несе статичні
// сторінки. Тест не ходить у мережу — модулі чисті (sitemap мокає fetch).
import robots from '../robots';
import sitemap from '../sitemap';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => jsonResponse([]));
  global.fetch = fetchMock as unknown as typeof fetch;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://fade.com.ua';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('robots (T-2600a)', () => {
  it('дозволяє публічні шляхи й закриває приватні від індексації', () => {
    const { rules } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;

    expect(rule?.allow).toBe('/');
    expect(rule?.disallow).toEqual(
      expect.arrayContaining(['/account/', '/booking/', '/login/', '/api/'])
    );
  });

  it('посилається на sitemap на канонічному хості', () => {
    expect(robots().sitemap).toBe('https://fade.com.ua/sitemap.xml');
  });
});

describe('sitemap (T-2600a)', () => {
  it('несе статичні сторінки на канонічному хості без подвійних слешів', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    for (const required of ['/locations', '/services', '/barbers', '/blog']) {
      expect(urls).toContain(`https://fade.com.ua${required}`);
    }
    expect(urls.some((url) => url.includes('com.ua//'))).toBe(false);
  });

  it('тримає статичні сторінки, коли каталог порожній (fail-open)', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://fade.com.ua/');
    expect(urls).toContain('https://fade.com.ua/services');
  });
});
