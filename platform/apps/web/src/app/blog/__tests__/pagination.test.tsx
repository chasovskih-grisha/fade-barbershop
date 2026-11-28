import { render, screen } from '@testing-library/react';
import * as mockReact from 'react';
import BlogPage from '../page';
import { BLOG_PAGE_SIZE, articleCursor, feedHref, paginateFeed } from '../feed-page';

// GWT T-2300e: сторінки стрічки — 12 карток, курсор не губить `q`, «назад»
// повертає на попередній курсор.

jest.mock('@/lib/api/articles', () => ({
  getPublishedArticles: jest.fn(),
  getPublishedArticle: jest.fn(),
}));
jest.mock(
  '@fade/ui',
  () => {
    const AlertBanner = ({ title }: Record<string, unknown>) =>
      mockReact.createElement('div', { role: 'alert' }, title as string);
    return { cn: (...args: unknown[]) => args.filter(Boolean).join(' '), AlertBanner };
  },
  { virtual: true }
);
jest.mock('@/app/components/states/ErrorState', () => ({
  ErrorState: ({ message }: { message: string }) => mockReact.createElement('p', null, message),
}));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: () => ({ refresh: jest.fn() }),
}));

// prettier-ignore
const { getPublishedArticles } = jest.requireMock('@/lib/api/articles') as { getPublishedArticles: jest.Mock };

const articleAt = (index: number) => ({
  id: `a${index}`,
  slug: `stattya-${index}`,
  title: `Стаття ${index}`,
  excerpt: null,
  coverUrl: null,
  authorName: null,
  tags: [],
  publishedAt: `2026-09-${String(index).padStart(2, '0')}T09:00:00Z`,
});

beforeEach(() => {
  getPublishedArticles.mockReset();
});

describe('feed page math', () => {
  it('keeps twelve cards and offers the next page from the twelfth', () => {
    const rows = Array.from({ length: 13 }, (_, i) => articleAt(i + 1));

    const page = paginateFeed(rows, '', []);

    expect(page.items).toHaveLength(BLOG_PAGE_SIZE);
    expect(page.items.at(-1)?.id).toBe('a12');
    expect(page.nextHref).toBe(feedHref('', [articleCursor(rows[11]!) as string]));
    expect(page.prevHref).toBeNull();
  });

  it('has no next page when the feed fits', () => {
    const page = paginateFeed(
      Array.from({ length: 12 }, (_, i) => articleAt(i + 1)),
      '',
      []
    );

    expect(page.nextHref).toBeNull();
  });

  it('keeps the search term across forward and back links', () => {
    const trail = ['2026-09-12T09:00:00Z|a12'];

    const page = paginateFeed(
      Array.from({ length: 13 }, (_, i) => articleAt(i + 1)),
      'стрижка',
      trail
    );

    expect(page.prevHref).toBe('/blog?q=%D1%81%D1%82%D1%80%D0%B8%D0%B6%D0%BA%D0%B0');
    expect(page.nextHref).toContain('q=%D1%81%D1%82%D1%80%D0%B8%D0%B6%D0%BA%D0%B0');
    expect(page.nextHref).toContain('p=2026-09-12T09%3A00%3A00Z%7Ca12');
  });

  it('has no cursor for an article without a publication date', () => {
    expect(articleCursor({ ...articleAt(1), publishedAt: null })).toBeNull();
  });
});

describe('blog feed pages', () => {
  it('asks the API from the cursor in the address and links both ways', async () => {
    getPublishedArticles.mockResolvedValue({
      state: 'ok',
      data: Array.from({ length: 13 }, (_, i) => articleAt(i + 1)),
    });

    render(
      await BlogPage({
        searchParams: Promise.resolve({ q: 'стрижка', p: ['2026-09-20T09:00:00Z|a20'] }),
      })
    );

    expect(getPublishedArticles).toHaveBeenCalledWith({
      limit: 13,
      q: 'стрижка',
      cursor: '2026-09-20T09:00:00Z|a20',
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(BLOG_PAGE_SIZE);
    expect(screen.getByRole('link', { name: /Новіші/ })).toHaveAttribute(
      'href',
      expect.stringContaining('q=')
    );
    expect(screen.getByRole('link', { name: /Старіші/ })).toBeInTheDocument();
  });

  it('does not render pagination for a single page', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'ok', data: [articleAt(1)] });

    render(await BlogPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole('navigation', { name: /Сторінки стрічки/ })).toBeNull();
  });
});
