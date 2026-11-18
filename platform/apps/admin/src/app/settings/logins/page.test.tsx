// Тести екрана «Журнал входів» (T-4411 UI): бейджі, редірект, порожній стан.
import { render, screen, waitFor } from '@testing-library/react';
import LoginAuditPage from './page';
import { mockLoginRoutes } from './login-test-helpers';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const ENTRIES = {
  entries: [
    { ts: '2026-09-28T10:15:00.000Z', username: 'admin', ok: true },
    { ts: '2026-09-28T09:00:00.000Z', username: 'admin', ok: false },
    { ts: '2026-09-27T18:30:00.000Z', username: 'owner', ok: true },
  ],
};

describe('LoginAuditPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('fetches /admin/auth/me then the audit and renders ok/failed badges', async () => {
    mockLoginRoutes(200, { status: 200, body: ENTRIES });
    render(<LoginAuditPage />);
    const table = await screen.findByRole('table', { name: 'Журнал входів' });
    expect(table).toBeInTheDocument();
    expect(screen.getByText('28.09.2026 13:15')).toBeInTheDocument();
    expect(screen.getByText('27.09.2026 21:30')).toBeInTheDocument();
    expect(screen.getAllByText('Успішно')).toHaveLength(2);
    expect(screen.getAllByText('Невдача')).toHaveLength(1);
  });

  it('redirects to login when the session is missing', async () => {
    mockLoginRoutes(401, null);
    render(<LoginAuditPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
    expect(
      (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).includes('/logins'))
    ).toHaveLength(0);
  });

  it('redirects to login when the audit call answers 401', async () => {
    mockLoginRoutes(200, { status: 401 });
    render(<LoginAuditPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('shows empty state when there are no entries', async () => {
    mockLoginRoutes(200, { status: 200, body: { entries: [] } });
    render(<LoginAuditPage />);
    expect(await screen.findByText('Записів ще немає.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
