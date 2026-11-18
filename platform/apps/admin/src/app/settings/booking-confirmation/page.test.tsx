// Специфікація сторінки «Підтвердження запису»: завантаження поточного
// каналу, вибір нового → PUT, тост після збереження.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingConfirmationSettingsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/settings/booking-confirmation',
}));

const settingsGet = (channel: string) =>
  jest.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/admin/settings/booking-confirmation') && !init?.method)
      return Promise.resolve({ ok: true, json: async () => ({ channel }) });
    if (url.endsWith('/admin/settings/booking-confirmation') && init?.method === 'PUT')
      return Promise.resolve({
        ok: true,
        json: async () => ({ channel: JSON.parse(String(init.body)).channel }),
      });
    return Promise.resolve({ ok: false });
  });

describe('BookingConfirmationSettingsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує поточний канал як активний', async () => {
    (global.fetch as jest.Mock).mockImplementation(settingsGet('email'));
    render(<BookingConfirmationSettingsPage />);

    const active = await screen.findByLabelText('Email');
    expect(active).toBeChecked();
    expect(screen.getByLabelText('SMS клієнту')).not.toBeChecked();
  });

  it('вибір «SMS клієнту» → PUT з channel=sms і тост', async () => {
    (global.fetch as jest.Mock).mockImplementation(settingsGet('email'));
    render(<BookingConfirmationSettingsPage />);
    await screen.findByLabelText('Email');

    await userEvent.click(screen.getByLabelText('SMS клієнту'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/settings/booking-confirmation',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ channel: 'sms' }) })
      )
    );
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});
