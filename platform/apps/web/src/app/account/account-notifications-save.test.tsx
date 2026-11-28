import { fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { lastPatchBody, marketingToggle, mockFetch, renderAccountPage, smsToggle } from './account-notifications.harness';

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

describe('AccountPage notification saving', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('restores the last saved values when the save fails', async () => {
    mockFetch((_url, init) =>
      init?.method === 'PATCH' ? Promise.resolve({ ok: false, json: async () => ({}) }) : undefined
    );

    renderAccountPage();

    await waitFor(() => expect(smsToggle()).toBeEnabled());
    fireEvent.click(smsToggle());
    expect(smsToggle()).not.toBeChecked();

    fireEvent.click(screen.getByText('Зберегти налаштування'));

    await waitFor(() => {
      expect(screen.getByText(/Помилка збереження/)).toBeInTheDocument();
    });
    expect(smsToggle()).toBeChecked();
  });

  it('keeps marketing off while SMS stays on', async () => {
    mockFetch((_url, init) =>
      init?.method === 'PATCH'
        ? Promise.resolve({ ok: true, json: async () => JSON.parse(String(init.body)) })
        : undefined
    );

    renderAccountPage();

    await waitFor(() => expect(smsToggle()).toBeEnabled());

    fireEvent.click(marketingToggle());
    expect(marketingToggle()).toBeChecked();
    expect(smsToggle()).toBeChecked();

    fireEvent.click(screen.getByText('Зберегти налаштування'));
    await waitFor(() => expect(screen.getByText('Збережено')).toBeInTheDocument());

    expect(lastPatchBody()).toMatchObject({ smsReminders: true, marketingOffers: true });
  });
});
