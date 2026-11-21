import { fireEvent, render, screen } from '@testing-library/react';
import ArticlePage from '../[slug]/page';

// T-2300h: одна стаття — одна article_view, клік «Записатися» — один
// cta_booking_click із cta_location=article. 404 і помилка подій не шлють.

jest.mock('@/lib/api/articles', () => ({
  getPublishedArticle: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('@/app/components/states/ErrorState', () => ({
  ErrorState: ({ message }: { message: string }) => {
    const React = jest.requireActual('react');
    return React.createElement('div', { role: 'alert' }, message);
  },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: { href: string; children: unknown }) => {
    const React = jest.requireActual('react');
    const { href, children, ...rest } = props;
    return React.createElement('a', { href, ...rest }, children);
  },
}));

// prettier-ignore
const { getPublishedArticle } = jest.requireMock('@/lib/api/articles') as { getPublishedArticle: jest.Mock };

const article = {
  id: 'a1',
  slug: 'strizhka',
  title: 'Стрижка по-київськи',
  excerpt: 'Коротко про стиль.',
  body: 'Перший абзац.\n\nДругий абзац.',
  coverUrl: null,
  authorName: 'Команда Fade',
  tags: ['стиль', 'догляд'],
  status: 'published',
  publishedAt: '2026-09-20T09:00:00Z',
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-20T09:00:00Z',
};

const renderArticle = async () => {
  getPublishedArticle.mockResolvedValue({ state: 'ok', data: article });
  render(await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) }));
};

const events = () => (window.dataLayer ?? []).map((e) => e.event);
const paramsOf = (name: string) =>
  (window.dataLayer ?? []).find((e) => e.event === name) as Record<string, unknown>;

beforeEach(() => {
  window.dataLayer = [];
  getPublishedArticle.mockReset();
});

describe('T-2300h blog analytics', () => {
  it('shoots exactly one article_view with slug and first tag, no title or body', async () => {
    await renderArticle();
    const views = (window.dataLayer ?? []).filter((e) => e.event === 'article_view');
    expect(views).toHaveLength(1);
    const view = paramsOf('article_view');
    expect(view).toMatchObject({ article_slug: 'strizhka', article_tag: 'стиль' });
    expect(view).not.toHaveProperty('article_title');
    expect(JSON.stringify(view)).not.toContain('Перший абзац');
  });

  it('shoots one cta_booking_click with cta_location=article on Book', async () => {
    await renderArticle();
    fireEvent.click(screen.getByRole('link', { name: 'Записатися на стрижку' }));
    expect(paramsOf('cta_booking_click')).toMatchObject({ cta_location: 'article' });
    expect(events().filter((e) => e === 'cta_booking_click')).toHaveLength(1);
  });

  it('does not shoot article_view for an error page', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'error', message: 'Збій.' });
    render(await ArticlePage({ params: Promise.resolve({ slug: 'strizhka' }) }));
    expect(events()).not.toContain('article_view');
  });

  it('does not shoot article_view for a missing article', async () => {
    getPublishedArticle.mockResolvedValue({ state: 'notFound' });
    await expect(ArticlePage({ params: Promise.resolve({ slug: 'nema' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(events()).not.toContain('article_view');
  });
});
