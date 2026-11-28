import { blocksToHtml, buildRssFeed } from '../rss';
import { GET } from '../rss.xml/route';
import { FakeResponse, rssArticle } from '../blog-rss-fixtures';

// RSS блогу (T-2300c): у стрічці лише опубліковані статті, текст — наші блоки,
// екрановані на сервері. Чернетка і зламаний API не ламають канал.

jest.mock('@/lib/api/articles', () => ({
  BLOG_REVALIDATE_SEC: 300,
  getPublishedArticles: jest.fn(),
  getPublishedArticle: jest.fn(),
}));

globalThis.Response = FakeResponse as unknown as typeof Response;

const { getPublishedArticles, getPublishedArticle } = jest.requireMock('@/lib/api/articles') as {
  getPublishedArticles: jest.Mock;
  getPublishedArticle: jest.Mock;
};

beforeEach(() => {
  getPublishedArticles.mockReset();
  getPublishedArticle.mockReset();
});

describe('blocksToHtml', () => {
  it('малює блоки й екранує текст, а не віддає HTML як є', () => {
    expect(blocksToHtml(rssArticle.blocks)).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><h2>Стиль</h2><ul><li>раз</li><li>два</li></ul>'
    );
  });

  it('image несе екрановані src/alt', () => {
    const html = blocksToHtml([
      { type: 'image', src: 'https://x/a.png?a=1&b=2', alt: 'ніж "pro"', caption: null },
    ]);
    expect(html).toBe(
      '<figure><img src="https://x/a.png?a=1&amp;b=2" alt="ніж &quot;pro&quot;" /></figure>'
    );
  });
});

describe('buildRssFeed', () => {
  it('пропускає чернетки без дати публікації й екранує заголовок', () => {
    const xml = buildRssFeed(
      [rssArticle, { ...rssArticle, slug: 'draft', publishedAt: null }],
      'https://fade.com.ua'
    );

    expect(xml).toContain('<link>https://fade.com.ua/blog/strizhka</link>');
    expect(xml).toContain('<title>Стрижка &amp; догляд</title>');
    expect(xml).not.toContain('/blog/draft');
    expect(xml).toContain('<lastBuildDate>Mon, 21 Sep 2026 09:00:00 GMT</lastBuildDate>');
  });

  it('порожній список дає валідний канал без item', () => {
    const xml = buildRssFeed([], 'https://fade.com.ua');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).not.toContain('<item>');
  });
});

describe('GET /blog/rss.xml', () => {
  it('віддає статтю зі списку та пропускає ту, що не завантажилась', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'ok', data: [rssArticle, rssArticle] });
    getPublishedArticle
      .mockResolvedValueOnce({ state: 'ok', data: rssArticle })
      .mockResolvedValueOnce({ state: 'error', message: 'API 500' });

    const response = (await GET()) as unknown as FakeResponse;

    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect((await response.text()).match(/<item>/g)).toHaveLength(1);
  });

  it('помилка списку не робить стрічку помилкою', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'error', message: 'API 500' });

    const response = (await GET()) as unknown as FakeResponse;

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('<item>');
    expect(getPublishedArticle).not.toHaveBeenCalled();
  });
});
