import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    mockPush.mockReset();
    // Reset fetch mock
    global.fetch = jest.fn();
    // Silence console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fetches and displays admin name', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ phone: '123-456' }),
    });

    render(<Header />);
    await waitFor(() => expect(screen.getByText('123-456')).toBeInTheDocument());
  });

  it('calls logout and redirects to login page', async () => {
    // First call – admin info
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ phone: 'admin' }),
      })
      // Second call – logout endpoint
      .mockResolvedValueOnce({ ok: true });

    render(<Header />);
    await waitFor(() => screen.getByText('admin'));

    const logoutBtn = screen.getByRole('button', { name: 'Вийти' });
    await userEvent.click(logoutBtn);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});
