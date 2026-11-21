import { fetchArticle, fetchArticleFeed } from './articles';

global.fetch = jest.fn();

const summary = (overrides: Record<string, unknown> = {}) => ({
  id: 'a-1',
  slug: 'fade-cut',
  title: 'Як доглядати за fade',
  excerpt: 'Коротко про догляд',
  coverUrl: null,
  authorName: 'Fade Team',
  tags: ['догляд'],
  publishedAt: '2026-11-01T09:00:00.000Z',
  ...overrides,
});

describe('blog api client (T-2300f)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the published feed from the public API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [summary()],
    });

    const list = await fetchArticleFeed(10);

    expect(list).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:13000/content/articles?limit=10');
  });

  it('treats an unknown or draft slug as a missing article, not an error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchArticle('draft-post')).resolves.toEqual({ state: 'notFound' });
  });

  it('reports a network failure as an error state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchArticle('fade-cut')).resolves.toEqual({ state: 'error' });
  });

  it('returns the article body for a published slug', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...summary(), body: 'Перший абзац' }),
    });

    const result = await fetchArticle('fade-cut');

    expect(result).toEqual({
      state: 'ok',
      article: expect.objectContaining({ body: 'Перший абзац' }),
    });
  });
});
