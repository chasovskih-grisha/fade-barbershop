// Банери серії невдалих входів (T-4411 owner-подання).
import { render, screen, fireEvent } from '@testing-library/react';
import LoginAuditPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('LoginAuditPage — streak банери', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('банер серії: ≥3 підряд невдалих — агресивний alert з порадою скинути пароль', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/admin/auth/me')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 'admin-1' }) });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          entries: [
            {
              ts: '2026-09-29T12:00:00.000Z',
              username: 'support',
              ok: false,
              userId: 'admin-2-uuid-0001',
            },
          ],
          failedStreak: 3,
        }),
      });
    });
    render(<LoginAuditPage />);
    await screen.findByRole('table', { name: 'Журнал входів' });
    fireEvent.change(screen.getByLabelText('Подання'), { target: { value: 'all' } });

    const banner = await screen.findByRole('alert');
    expect(banner.textContent).toContain('Серія невдалих входів: 3 підряд');
    expect(banner.textContent).toContain('перебір');
  });

  it('коротка серія (1–2) — попереджувальний status-банер без тривоги', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/admin/auth/me')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 'admin-1' }) });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          entries: [
            { ts: '2026-09-29T12:00:00.000Z', username: 'owner', ok: false, userId: 'admin-1' },
          ],
          failedStreak: 1,
        }),
      });
    });
    render(<LoginAuditPage />);
    await screen.findByRole('table', { name: 'Журнал входів' });
    fireEvent.change(screen.getByLabelText('Подання'), { target: { value: 'all' } });

    const banner = await screen.findByRole('status');
    expect(banner.textContent).toContain('Останні 1 спроб входу невдалі');
  });
});
