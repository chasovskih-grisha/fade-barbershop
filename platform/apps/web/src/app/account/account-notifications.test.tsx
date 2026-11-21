import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from './page';

const mockUser = {
  id: 'usr_1',
  name: 'Олександр',
  phone: '+380991234567',
  preferences: ['Короткий вісок', 'Без бороди'],
};

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    logout: jest.fn(),
  }),
}));

describe('AccountPage Notifications & Profile', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/haircut-ai/assets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile and notification preferences correctly', async () => {
    render(<AccountPage />);

    expect(screen.getByDisplayValue('Олександр')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+380991234567')).toBeInTheDocument();
    expect(screen.getByText('Сповіщення')).toBeInTheDocument();
    expect(await screen.findAllByText('SMS-нагадування')).not.toHaveLength(0);
  });

  it('allows updating notification preferences and saving them', async () => {
    render(<AccountPage />);

    // Wait for initial load
    await screen.findByText('Сповіщення');

    const smsToggles = screen.getAllByRole('checkbox', { name: /SMS-нагадування/i });
    const smsToggle = smsToggles[0]!;
    expect(smsToggle).toBeChecked();

    fireEvent.click(smsToggle);
    expect(smsToggle).not.toBeChecked();

    const saveButton = screen.getByText('Зберегти налаштування');
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Збережено')).toBeInTheDocument();
    });
  });
});
