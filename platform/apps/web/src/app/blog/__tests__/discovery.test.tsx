import { render, screen } from '@testing-library/react';
import * as mockReact from 'react';
import BlogPage from '../page';
import BlogTagPage from '../tag/[tag]/page';

// GWT T-2300e: пошук у стрічці, архів тегу, невідомий тег = 404.

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
const { getPublishedArticles } = jest.requireMock('@/lib/api/articles') as { getPublishedArticles: jest.Mock };

const article = {
  id: 'a1',
  slug: 'strizhka',
  title: 'Стрижка по-київськи',
  excerpt: 'Коротко про стиль.',
  coverUrl: null,
  authorName: 'Команда Fade',
  tags: ['стиль'],
  status: 'published',
  publishedAt: '2026-09-20T09:00:00Z',
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-20T09:00:00Z',
};

beforeEach(() => {
  getPublishedArticles.mockReset();
});

describe('blog feed search', () => {
  it('passes q from the URL to the API and keeps it in the field', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'ok', data: [article] });

    render(await BlogPage({ searchParams: Promise.resolve({ q: 'стрижка' }) }));

    expect(getPublishedArticles).toHaveBeenCalledWith({ q: 'стрижка' });
    expect(screen.getByDisplayValue('стрижка')).toBeInTheDocument();
    expect(screen.getByText('Стрижка по-київськи')).toBeInTheDocument();
  });

  it('shows the "nothing found" state, not the empty-feed state', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'empty' });

    render(await BlogPage({ searchParams: Promise.resolve({ q: 'ніщо' }) }));

    expect(screen.getByText(/нічого не знайшлося/)).toBeInTheDocument();
    expect(screen.queryByText(/Поки що немає опублікованих статей/)).not.toBeInTheDocument();
  });

  it('asks for the whole feed when q is blank', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'ok', data: [article] });

    render(await BlogPage({ searchParams: Promise.resolve({ q: '  ' }) }));

    expect(getPublishedArticles).toHaveBeenCalledWith({});
  });
});

describe('tag archive', () => {
  it('asks the API for the tag and lists its articles', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'ok', data: [article] });

    render(await BlogTagPage({ params: Promise.resolve({ tag: 'стиль' }) }));

    expect(getPublishedArticles).toHaveBeenCalledWith({ tag: 'стиль' });
    expect(screen.getByRole('heading', { name: 'стиль' })).toBeInTheDocument();
    expect(screen.getByText('Стрижка по-київськи')).toBeInTheDocument();
  });

  it('answers 404 for a tag without published articles', async () => {
    getPublishedArticles.mockResolvedValue({ state: 'empty' });

    await expect(BlogTagPage({ params: Promise.resolve({ tag: 'nema' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});
