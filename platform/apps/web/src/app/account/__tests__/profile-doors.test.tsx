import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from '../page';

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

describe('AccountPage profile doors (T-4732b)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('does not duplicate appointments or devices links in profile body', () => {
    render(<AccountPage />);
    expect(screen.queryByRole('link', { name: /мої візити/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /пристрої/i })).toBeNull();
  });
});
