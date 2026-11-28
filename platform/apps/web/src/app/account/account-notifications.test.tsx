import { fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockFetch, renderAccountPage, smsToggle, storedNotifications } from './account-notifications.harness';

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'usr_1',
      name: 'Олександр',
      phone: '+380991234567',
      preferences: ['Короткий вісок', 'Без бороди'],
    },
    token: 'test-token',
    logout: jest.fn(),
  }),
}));

describe('AccountPage notification switches', () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile and notification preferences correctly', async () => {
    renderAccountPage();

    expect(screen.getByDisplayValue('Олександр')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+380991234567')).toBeInTheDocument();
    expect(screen.getByText('Сповіщення')).toBeInTheDocument();
    expect(await screen.findAllByText('SMS-нагадування')).not.toHaveLength(0);
  });

  it('shows the stored values once they load', async () => {
    mockFetch(() =>
      Promise.resolve({ ok: true, json: async () => ({ ...storedNotifications, smsReminders: false }) })
    );

    renderAccountPage();

    await waitFor(() => expect(smsToggle()).toBeEnabled());
    expect(smsToggle()).not.toBeChecked();
  });

  it('keeps the switches disabled until the stored values load', async () => {
    let release: (value: unknown) => void = () => undefined;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    mockFetch(() => pending);

    renderAccountPage();
    await screen.findByText('Сповіщення');

    expect(smsToggle()).toBeDisabled();

    release({ ok: true, json: async () => storedNotifications });
    await waitFor(() => expect(smsToggle()).toBeEnabled());
  });

  it('allows updating notification preferences and saving them', async () => {
    renderAccountPage();

    await waitFor(() => expect(smsToggle()).toBeEnabled());
    expect(smsToggle()).toBeChecked();

    fireEvent.click(smsToggle());
    expect(smsToggle()).not.toBeChecked();

    const saveButton = screen.getByText('Зберегти налаштування');
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Збережено')).toBeInTheDocument();
    });
  });
});
