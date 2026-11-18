import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminLoginPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('відправляє username + password і перенаправляє на /', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'owner' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'FadeSecret2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
    expect(global.fetch).toHaveBeenCalledWith(
      '/admin/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.stringContaining('"username":"owner","password":"FadeSecret2026"'),
      })
    );
  });

  it('показує помилку при 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Wrong username or password' }),
    });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'owner' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));

    expect(await screen.findByText('Wrong username or password')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
