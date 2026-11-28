import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountShell } from '../components/AccountShell';
import AccountPage from '../page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/account',
}));

jest.mock('../../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'usr_1', name: 'Олександр', phone: '+380991234567', preferences: [] },
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

const PREFERENCES = /алергії, уподобання, побажання для майстра/i;

function renderCabinet() {
  return render(
    <AccountShell>
      <AccountPage />
    </AccountShell>
  );
}

function makeDirty() {
  fireEvent.change(screen.getByLabelText(PREFERENCES), { target: { value: 'Алергія на аміак' } });
}

describe('account unsaved-edit prompt (T-4733b)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('asks before «Мої візити» when the note is dirty', () => {
    renderCabinet();
    makeDirty();

    fireEvent.click(screen.getByRole('link', { name: 'Мої візити' }));

    expect(screen.getByText('Зберегти зміни?')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not ask when the profile is clean', () => {
    renderCabinet();

    fireEvent.click(screen.getByRole('link', { name: 'Мої візити' }));

    expect(screen.queryByText('Зберегти зміни?')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/account/appointments');
  });

  it('stays on the profile when the save fails', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url === '/api/account/preferences'
        ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
        : Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    );
    renderCabinet();
    makeDirty();
    fireEvent.click(screen.getByRole('link', { name: 'Мої візити' }));

    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => expect(screen.queryByText('Зберегти зміни?')).toBeNull());
    expect(mockPush).not.toHaveBeenCalled();
  });
});
