import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BlogPage from './page';

// GWT-сценарії MNG-ADM-17: чернетка не публікується автоматично, публікація
// робить статтю опублікованою, зняття повертає у чернетки. Сторінка — обгортка
// BlogManager (cookie-сесію перевіряє AdminShell у layout), тому черга моків —
// лише виклики блогового API (blog-api.ts → /admin/content/...).

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));

const draft = {
  id: 'a1',
  slug: 'strizhka',
  title: 'Стрижка по-київськи',
  excerpt: null,
  body: 'Текст',
  coverUrl: null,
  authorName: 'Команда Fade',
  tags: [],
  status: 'draft',
  publishedAt: null,
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-20T09:00:00Z',
};

function fetchOk(sequence: unknown[]) {
  const mock = jest.fn();
  for (const value of sequence) mock.mockResolvedValueOnce({ ok: true, json: async () => value });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe('BlogPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує чернетки зі статусом «Чернетка»', async () => {
    fetchOk([[draft]]);
    render(<BlogPage />);
    expect(await screen.findByRole('article', { name: 'Стрижка по-київськи' })).toBeInTheDocument();
    expect(screen.getByText('Чернетка')).toBeInTheDocument();
  });

  it('публікує статтю і показує дату публікації', async () => {
    const mock = fetchOk([
      [draft],
      { id: 'a1', slug: 'strizhka', publishedAt: '2026-09-20T09:00:00Z' },
      [{ ...draft, status: 'published', publishedAt: '2026-09-20T09:00:00Z' }],
    ]);
    render(<BlogPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Опублікувати' }));
    await waitFor(() => expect(screen.getByText(/Опубліковано/)).toBeInTheDocument());
    expect(mock).toHaveBeenCalledWith(
      '/admin/content/articles/a1/publish',
      expect.objectContaining({ method: 'POST' })
    );
    expect(screen.getByRole('button', { name: 'Зняти з публікації' })).toBeInTheDocument();
  });

  it('помилка завантаження — AlertBanner з повтором, не порожній екран', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ code: 'CONTENT_INTERNAL' }),
    });
    render(<BlogPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Не вдалося завантажити статті');
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeInTheDocument();
  });
});
