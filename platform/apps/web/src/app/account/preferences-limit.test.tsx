import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from './page';
import { MAX_PREFERENCE_LINE_LENGTH, PREFERENCE_LIMIT_MESSAGE } from './preferences';

// T-4721b: екран відмовляє українською до запиту замість англійського 400 з роута.

const mockUser = {
  id: 'usr_1',
  name: 'Олександр',
  phone: '+380991234567',
  preferences: [],
};

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

const preferencesCalls = (fetchMock: jest.Mock) =>
  fetchMock.mock.calls.filter(
    ([url]) => typeof url === 'string' && url.includes('/api/account/preferences')
  );

describe('AccountPage preference limit (T-4721b)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => jest.clearAllMocks());

  it('показує українське речення і не шле запит на 21 рядок', async () => {
    render(<AccountPage />);
    const field = screen.getByLabelText(/Алергії, уподобання, побажання/i);

    fireEvent.change(field, {
      target: { value: Array.from({ length: 21 }, (_, i) => `рядок ${i}`).join('\n') },
    });

    expect(screen.getByText(PREFERENCE_LIMIT_MESSAGE)).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Зберегти вподобання' });
    expect(save).toBeDisabled();

    fireEvent.click(save);
    await waitFor(() => expect(preferencesCalls(fetchMock)).toHaveLength(0));
  });

  it('показує речення на рядок у 101 символ', async () => {
    render(<AccountPage />);
    const field = screen.getByLabelText(/Алергії, уподобання, побажання/i);

    fireEvent.change(field, { target: { value: 'x'.repeat(MAX_PREFERENCE_LINE_LENGTH + 1) } });

    expect(screen.getByText(PREFERENCE_LIMIT_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зберегти вподобання' })).toBeDisabled();
  });

  it('зберігає нотатку в межах ліміту', async () => {
    render(<AccountPage />);
    const field = screen.getByLabelText(/Алергії, уподобання, побажання/i);

    fireEvent.change(field, { target: { value: 'алергія на ефірні олії' } });

    expect(screen.queryByText(PREFERENCE_LIMIT_MESSAGE)).not.toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Зберегти вподобання' });
    expect(save).not.toBeDisabled();

    fireEvent.click(save);
    await waitFor(() => expect(preferencesCalls(fetchMock)).toHaveLength(1));
  });
});
