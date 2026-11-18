// Фільтр статусу у CMS блогу: чернетки/опубліковані/усі.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BlogPage from './page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const draft = {
  id: 'a1',
  slug: 'draft-post',
  title: 'Чернетка',
  excerpt: null,
  body: 'Текст',
  coverUrl: null,
  authorName: null,
  tags: [],
  status: 'draft',
  publishedAt: null,
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-20T09:00:00Z',
};

const published = { ...draft, id: 'a2', slug: 'live-post', title: 'Живий', status: 'published' };

describe('BlogManager — фільтр статусу', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('«Чернетки» ховає опубліковані статті, лічильник оновлюється', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [draft, published],
    });
    render(<BlogPage />);
    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Чернетка' })).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'draft' } });
    expect(screen.queryByRole('article', { name: 'Живий' })).toBeNull();
    expect(screen.getByRole('article', { name: 'Чернетка' })).toBeInTheDocument();
    expect(screen.getByText('Показано: 1 з 2')).toBeInTheDocument();
  });

  it('«Опубліковані» лишає лише живі статті', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [draft, published],
    });
    render(<BlogPage />);
    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Чернетка' })).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'published' } });
    expect(screen.getByRole('article', { name: 'Живий' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Чернетка' })).toBeNull();
  });
});
