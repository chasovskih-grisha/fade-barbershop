// Owner-подання журналу входів (T-4411): перемикач «Усі адміністратори»,
// колонка «Адмін», фільтр ?userId=.
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoginAuditPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const ALL = {
  entries: [
    { ts: '2026-09-29T12:00:00.000Z', username: 'support', ok: false, userId: 'admin-2-uuid-0001' },
    { ts: '2026-09-29T10:00:00.000Z', username: 'owner', ok: true, userId: 'admin-1-uuid-0001' },
  ],
};

describe('LoginAuditPage — owner-подання «Усі адміністратори»', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  function mockRoutes() {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/admin/auth/me')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 'admin-1' }) });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ALL });
    });
  }

  it('фетчить read-side ендпоінт і показує колонку «Адмін»', async () => {
    mockRoutes();
    render(<LoginAuditPage />);
    await screen.findByRole('table', { name: 'Журнал входів' });
    fireEvent.change(screen.getByLabelText('Подання'), { target: { value: 'all' } });

    expect(await screen.findByText('support')).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes('/admin/admins/logins')
      )
    ).toBe(true);
    expect(screen.getByRole('columnheader', { name: 'Адмін' })).toBeInTheDocument();
    expect(screen.getByTitle('admin-2-uuid-0001').textContent).toBe('admin-2-');
    expect(screen.getAllByText('Невдача').length).toBeGreaterThanOrEqual(1);
  });

  it('фільтр «Адмін» робить запит з ?userId=', async () => {
    mockRoutes();
    render(<LoginAuditPage />);
    await screen.findByRole('table', { name: 'Журнал входів' });
    fireEvent.change(screen.getByLabelText('Подання'), { target: { value: 'all' } });

    fireEvent.change(await screen.findByLabelText('Адмін'), {
      target: { value: 'admin-2-uuid-0001' },
    });
    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes('userId=admin-2-uuid-0001')
        )
      ).toBe(true)
    );
  });

  it('без серії банера немає', async () => {
    mockRoutes();
    render(<LoginAuditPage />);
    await screen.findByRole('table', { name: 'Журнал входів' });
    fireEvent.change(screen.getByLabelText('Подання'), { target: { value: 'all' } });
    await screen.findByText('support');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
