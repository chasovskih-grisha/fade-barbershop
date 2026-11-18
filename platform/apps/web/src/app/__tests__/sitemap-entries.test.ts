// Тести sitemap (T-030): динамічні записи з API, fail-open і SEO-покриття
// сторінок послуг. fetch мокається за URL ендпоінта.
import { getServiceEntries } from '../sitemap-entries';
import sitemap from '../sitemap';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function routeApi(routes: Record<string, Response | Error>): void {
  fetchMock.mockImplementation(async (url: string) => {
    const key = Object.keys(routes).find((path) => url.includes(path));
    if (!key) throw new Error(`unexpected ${url}`);
    const value = routes[key] as Response | Error;
    if (value instanceof Error) throw value;
    return value;
  });
}

describe('getServiceEntries', () => {
  it('віддає URL сторінок послуг і пропускає записи без id', async () => {
    routeApi({
      '/public/services/active': jsonResponse([{ id: 'srv-1' }, { id: '' }, { name: 'x' }]),
    });

    const entries = await getServiceEntries('https://fade.com.ua');

    expect(entries).toEqual([
      { url: 'https://fade.com.ua/services/srv-1', changeFrequency: 'weekly', priority: 0.7 },
    ]);
  });

  it('мовчки повертає порожній список, коли API недоступний (fail-open)', async () => {
    routeApi({ '/public/services/active': new Error('network down') });

    expect(await getServiceEntries('https://fade.com.ua')).toEqual([]);
  });
});

describe('sitemap', () => {
  it('включає сторінки послуг, локацій і барберів поруч зі статичними', async () => {
    routeApi({
      '/locations': jsonResponse([{ id: 'loc-1', code: 'KYY-01' }]),
      '/public/services/active': jsonResponse([{ id: 'srv-1' }]),
      '/booking/barbers/': jsonResponse([{ slug: 'alex' }, { slug: '', any: true }]),
      '/content/articles': jsonResponse([{ slug: 'news', publishedAt: null }]),
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://fade.com.ua/services/srv-1');
    expect(urls).toContain('https://fade.com.ua/locations/KYY-01');
    expect(urls).toContain('https://fade.com.ua/barbers/alex');
    expect(urls).toContain('https://fade.com.ua/blog/news');
    expect(urls).toContain('https://fade.com.ua/services');
  });

  it('тримає статичні сторінки, коли API мовчить', async () => {
    routeApi({
      '/locations': new Error('down'),
      '/public/services/active': new Error('down'),
      '/booking/barbers/': new Error('down'),
      '/content/articles': new Error('down'),
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://fade.com.ua/services');
    expect(urls).toContain('https://fade.com.ua/barbers');
  });
});
