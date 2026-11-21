import { generateMetadata } from '../[slug]/page';

// SEO статті: тимчасова помилка API — це жива сторінка, а не «не знайдено»
// з noindex. Тест фіксує різницю між станами error і notFound (T-4513, T-031).

jest.mock('@/lib/api/articles', () => ({
  getPublishedArticles: jest.fn(),
  getPublishedArticle: jest.fn(),
}));
jest.mock('@/app/components/states/ErrorState', () => ({ ErrorState: () => null }));
jest.mock('@fade/ui', () => ({ cn: () => '' }), { virtual: true });
jest.mock('next/navigation', () => ({ notFound: jest.fn() }));

const { getPublishedArticle } = jest.requireMock('@/lib/api/articles') as {
  getPublishedArticle: jest.Mock;
};

beforeEach(() => getPublishedArticle.mockReset());

describe('generateMetadata — /blog/[slug]', () => {
  it('помилка API лишає сторінку індексувати під назвою розділу', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'error', message: 'API 500' });
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'beard-care-top-mistakes' }),
    });
    expect(meta.title).toBe('Блог');
    expect(meta.robots).toBeUndefined();
  });

  it('невідома стаття забороняє індексацію', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'notFound' });
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'missing' }) });
    expect(meta.title).toBe('Статтю не знайдено');
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});
