// Специфікація сторінки «Нагадування про візит» (T-080): показ поточних
// каналу й годин, вибір нового → PUT (години → хвилини), тост, стан помилки.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentReminderSettingsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/settings/appointment-reminder',
}));

const reminderApi = (channel: string, leadMinutes: number) => (url: string, init?: RequestInit) => {
  if (!url.endsWith('/admin/settings/appointment-reminder')) return Promise.resolve({ ok: false });
  if (init?.method === 'PUT') {
    const patch = JSON.parse(String(init.body)) as Record<string, unknown>;
    return Promise.resolve({ ok: true, json: async () => ({ channel, leadMinutes, ...patch }) });
  }
  return Promise.resolve({ ok: true, json: async () => ({ channel, leadMinutes }) });
};

const leadField = () => screen.getByLabelText('За скільки годин до візиту');

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AppointmentReminderSettingsPage', () => {
  it('показує поточний канал і години', async () => {
    (global.fetch as jest.Mock).mockImplementation(reminderApi('sms', 24 * 60));

    render(<AppointmentReminderSettingsPage />);

    expect(await screen.findByLabelText('SMS клієнту')).toBeChecked();
    expect(leadField()).toHaveValue('24');
  });

  it('вибір 48 годин → PUT leadMinutes=2880 і тост', async () => {
    (global.fetch as jest.Mock).mockImplementation(reminderApi('sms', 24 * 60));
    render(<AppointmentReminderSettingsPage />);
    await screen.findByLabelText('SMS клієнту');

    await userEvent.selectOptions(leadField(), '48');

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/settings/appointment-reminder',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ leadMinutes: 2880 }) })
      )
    );
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('вимкнення каналу → PUT channel=none', async () => {
    (global.fetch as jest.Mock).mockImplementation(reminderApi('sms', 24 * 60));
    render(<AppointmentReminderSettingsPage />);
    await screen.findByLabelText('SMS клієнту');

    await userEvent.click(screen.getByLabelText('Вимкнено'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/settings/appointment-reminder',
        expect.objectContaining({ body: JSON.stringify({ channel: 'none' }) })
      )
    );
  });

  it('поточне значення поза пресетами лишається в селекторі (5 год)', async () => {
    (global.fetch as jest.Mock).mockImplementation(reminderApi('sms', 5 * 60));

    render(<AppointmentReminderSettingsPage />);

    expect(await screen.findByRole('option', { name: '5 год' })).toBeInTheDocument();
    expect(leadField()).toHaveValue('5');
  });

  it('помилка завантаження → банер із повторною спробою', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<AppointmentReminderSettingsPage />);

    expect(await screen.findByText('Не вдалося завантажити налаштування.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeInTheDocument();
  });
});
