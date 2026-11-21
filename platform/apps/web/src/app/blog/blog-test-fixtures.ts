import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import BlogPage from './page';
import ArticlePage from './[slug]/page';

// prettier-ignore
const { getPublishedArticles, getPublishedArticle } = jest.requireMock('@/lib/api/articles') as { getPublishedArticles: jest.Mock; getPublishedArticle: jest.Mock };

export const article = {
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

export function resetArticleMocks(): void {
  getPublishedArticles.mockReset();
  getPublishedArticle.mockReset();
}

/** Сід моку + рендер BlogPage (DRY для трьох станів). */
export const renderBlog = async (mock: unknown): Promise<RenderResult> => {
  getPublishedArticles.mockResolvedValue(mock);
  return render(await BlogPage({ searchParams: Promise.resolve({}) }));
};

/** Сід моку + рендер ArticlePage (DRY для чотирьох станів). */
export const renderArticle = async (mock: unknown): Promise<RenderResult> => {
  getPublishedArticle.mockResolvedValue(mock);
  return render(await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) }));
};
