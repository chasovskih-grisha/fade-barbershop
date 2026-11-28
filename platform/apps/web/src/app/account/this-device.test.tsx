import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ClientSession } from '@fade/contracts';
import { getClientSessions } from '@/lib/api/client-sessions';
import AccountPage from './page';

// T-4724b: рядок «Цей пристрій» читає той самий список, що екран «Пристрої».

jest.mock('@/lib/api/client-sessions', () => ({
  getClientSessions: jest.fn(),
  revokeAllSessions: jest.fn(),
}));

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'usr_1', name: 'Олександр', phone: '+380991234567', preferences: [] },
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

const getSessions = getClientSessions as jest.MockedFunction<typeof getClientSessions>;

const session = (id: string, channel: 'web' | 'mobile', current: boolean): ClientSession => ({
  id,
  channel,
  createdAt: '2026-11-20T09:00:00.000Z',
  current,
});

const row = () => screen.getByTestId('this-device-row');

describe('AccountPage device row (T-4724b)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('показує канал поточної сесії і веде на екран пристроїв', async () => {
    getSessions.mockResolvedValue([session('s-web', 'web', true)]);
    render(<AccountPage />);

    await waitFor(() => expect(row()).toHaveTextContent('Вебсайт'));
    expect(screen.getByRole('link', { name: 'Цей пристрій' })).toHaveAttribute(
      'href',
      '/account/devices'
    );
  });

  it('рахує інші пристрої у «Ще N»', async () => {
    getSessions.mockResolvedValue([
      session('s-web', 'web', true),
      session('s-mob', 'mobile', false),
    ]);
    render(<AccountPage />);

    await waitFor(() => expect(row()).toHaveTextContent('Ще 1'));
  });

  it('не показує «Ще» без інших пристроїв', async () => {
    getSessions.mockResolvedValue([session('s-web', 'web', true)]);
    render(<AccountPage />);

    await waitFor(() => expect(row()).toHaveTextContent('Вебсайт'));
    expect(row()).not.toHaveTextContent('Ще');
  });

  it('невдале завантаження лишає посилання і прибирає лічильник', async () => {
    getSessions.mockRejectedValue(new Error('boom'));
    render(<AccountPage />);

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Цей пристрій' })).toBeInTheDocument()
    );
    expect(row()).not.toHaveTextContent('Ще');
  });
});
