// Повтор після помилки завантаження журналу входів.
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LoginAuditPage from './page';
import { mockLoginRoutes } from './login-test-helpers';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('LoginAuditPage — retry', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows retry block when the audit fails to load', async () => {
    mockLoginRoutes(200, { status: 500 });
    render(<LoginAuditPage />);
    expect(await screen.findByText('Не вдалося завантажити журнал входів.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('retry button reloads the audit after a failure', async () => {
    mockLoginRoutes(200, { status: 500 });
    render(<LoginAuditPage />);
    await screen.findByText('Не вдалося завантажити журнал входів.');
    mockLoginRoutes(200, {
      status: 200,
      body: { entries: [{ ts: '2026-09-28T10:15:00.000Z', username: 'admin', ok: true }] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    await waitFor(() => expect(screen.getByText('Успішно')).toBeInTheDocument());
  });
});
