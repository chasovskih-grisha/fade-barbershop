import { render, screen } from '@testing-library/react';
import * as mockReact from 'react';
import BlogPage from '../page';
import ArticlePage from '../[slug]/page';

// GWT-сценарії T-031: стрічка показує лише опубліковане, помилка API не
// вбиває сторінку, чернетка/невідомий slug = 404, стаття рендериться абзацами.

jest.mock('@/lib/api/articles', () => ({
  getPublishedArticles: jest.fn(),
  getPublishedArticle: jest.fn(),
}));
// @fade/ui не резолвиться в jest-середовищі (базовий стан): підміняємо лише
// те, що тягне картка й ErrorState — cn() і AlertBanner.
jest.mock(
  '@fade/ui',
  () => {
    const AlertBanner = ({ title, description, children }: Record<string, unknown>) =>
      mockReact.createElement(
        'div',
        { role: 'alert' },
        mockReact.createElement('p', null, title as string),
        mockReact.createElement('p', null, description as string),
        children as never
      );
    return { cn: (...args: unknown[]) => args.filter(Boolean).join(' '), AlertBanner };
  },
  { virtual: true }
);
// ErrorState тягне next-intl (ESM) і @fade/ui — у jest вони не резолвляться,
// тож стан помилки підміняється мінімальною розміткою з тими самими ролями.
jest.mock('@/app/components/states/ErrorState', () => {
  return {
    ErrorState: ({ message }: { message: string }) =>
      mockReact.createElement(
        'div',
        { role: 'alert' },
        mockReact.createElement('p', null, message),
        mockReact.createElement('button', null, 'Спробувати ще раз')
      ),
  };
});
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ refresh: jest.fn() }),
}));

// prettier-ignore
const { getPublishedArticles, getPublishedArticle } = jest.requireMock('@/lib/api/articles') as { getPublishedArticles: jest.Mock; getPublishedArticle: jest.Mock };

const article = {
  id: 'a1',
  slug: 'strizhka',
  title: 'Стрижка по-київськи',
  excerpt: 'Коротко про стиль.',
  body: 'Перший абзац.\n\nДругий абзац.',
  coverUrl: null,
  authorName: 'Команда Fade',
  tags: ['стиль'],
  // prettier-ignore
  status: 'published',
  publishedAt: '2026-09-20T09:00:00Z',
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-20T09:00:00Z',
};

beforeEach(() => {
  getPublishedArticles.mockReset();
  getPublishedArticle.mockReset();
});
/** Сід моку + рендер BlogPage (DRY для трьох станів). */
const renderBlog = async (mock: unknown) => {
  getPublishedArticles.mockResolvedValue(mock);
  render(await BlogPage({ searchParams: Promise.resolve({}) }));
};
/** Сід моку + рендер ArticlePage (DRY для чотирьох станів). */
const renderArticle = async (mock: unknown) => {
  getPublishedArticle.mockResolvedValue(mock);
  render(await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) }));
};

describe('/blog', () => {
  it('показує опубліковані статті з анонсом і датою', async () => {
    await renderBlog({ state: 'ok', data: [article] });
    expect(screen.getByRole('heading', { name: 'Стрижка по-київськи' })).toBeTruthy();
    expect(screen.getByText('Коротко про стиль.')).toBeTruthy();
    // prettier-ignore
    expect(screen.getByRole('link', { name: 'Стрижка по-київськи' }).getAttribute('href')).toBe('/blog/strizhka');
  });
  it('без статей — пояснення, не порожня сторінка', async () => {
    await renderBlog({ state: 'empty' });
    expect(screen.getByText(/немає опублікованих статей/)).toBeTruthy();
  });
  it('помилка API — AlertBanner із повтором', async () => {
    // prettier-ignore
    await renderBlog({ state: 'error', message: 'Сервіс недоступний. Спробуйте за кілька хвилин.' });
    expect(screen.getByRole('alert').textContent).toContain('Сервіс недоступний');
    expect(screen.getByRole('button', { name: /Спробувати ще раз/i })).toBeTruthy();
  });
});

describe('/blog/[slug]', () => {
  it('рендерить статтю абзацами й теги', async () => {
    await renderArticle({ state: 'ok', data: article });
    expect(screen.getByRole('heading', { level: 1, name: 'Стрижка по-київськи' })).toBeTruthy();
    expect(screen.getByText('Перший абзац.')).toBeTruthy();
    expect(screen.getByText('Другий абзац.')).toBeTruthy();
    expect(screen.getByText('стиль')).toBeTruthy();
  });
  it('невідома або не опублікована стаття — 404 (notFound)', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'notFound' });
    await expect(ArticlePage({ params: Promise.resolve({ slug: 'chy`etka' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  it('помилка API — сторінка лишається живою з повтором', async () => {
    // prettier-ignore
    await renderArticle({ state: 'error', message: 'Не вдалося завантажити дані. Спробуйте ще раз.' });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Спробувати ще раз/i })).toBeTruthy();
  });
  it('HTML із CMS не виконується: текст рендериться як текст', async () => {
    // prettier-ignore
    getPublishedArticle.mockResolvedValue({ state: 'ok', data: { ...article, body: '<img src=x onerror="alert(1)">' } });
    const { container } = render(
      await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) })
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeTruthy();
  });
  it('включає structured data JSON-LD (BlogPosting та BreadcrumbList)', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'ok', data: article });
    const { container } = render(
      await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) })
    );
    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).toBeTruthy();
    const jsonLd = JSON.parse(scriptTag?.textContent || '{}');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@graph']).toBeDefined();
    const blogPosting = jsonLd['@graph'].find((item: any) => item['@type'] === 'BlogPosting');
    expect(blogPosting).toBeDefined();
    expect(blogPosting.headline).toBe('Стрижка по-київськи');
  });
});
