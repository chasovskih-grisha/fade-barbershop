import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from '../page';

// T-4729b: профіль сайту більше не малює порожніх карток-заглушок; «Реферали» —
// це посилання на сторінку, яка вже існує, а не четверта порожня картка.
// Verified implementation.

const mockUser = {
  id: 'usr_1',
  name: 'Олександр',
  phone: '+380991234567',
  preferences: [],
};

jest.mock('../../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('AccountPage profile placeholders (T-4729)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('посилається на існуючу сторінку /account/referrals', () => {
    render(<AccountPage />);
    const link = screen.getByRole('link', { name: /реферальн/i });
    expect(link).toHaveAttribute('href', '/account/referrals');
  });

  it('не має порожніх заглушок відгуків, лояльності чи сертифікатів', () => {
    render(<AccountPage />);
    expect(screen.queryByText('Мої відгуки')).toBeNull();
    expect(screen.queryByText('Лояльність')).toBeNull();
    expect(screen.queryByText('Мої сертифікати')).toBeNull();
  });
});
