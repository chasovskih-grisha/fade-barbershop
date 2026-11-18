import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccountName, NAME_REQUIRED } from './useAccountName';
import type { User } from '@/lib/api/identity';

const user: User = {
  id: 'usr_1',
  phone: '+380991234567',
  name: 'Олександр',
  role: 'client',
  preferences: [],
};

function setup(name = user.name, refreshUser = jest.fn().mockResolvedValue(undefined)) {
  const hook = renderHook(() => useAccountName({ ...user, name }, 'token', refreshUser));
  return { ...hook, refreshUser };
}

describe('useAccountName (T-4719b)', () => {
  afterEach(() => jest.clearAllMocks());

  it('trims the value, saves it and refreshes the session', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { result, refreshUser } = setup();
    act(() => result.current.setName('  Олексій  '));
    await act(() => result.current.save());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/account/name',
      expect.objectContaining({ body: JSON.stringify({ name: 'Олексій' }) })
    );
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(result.current.name).toBe('Олексій');
    expect(result.current.error).toBeNull();
  });

  it('refuses whitespace without calling the route or clearing the name', async () => {
    global.fetch = jest.fn();
    const { result, refreshUser } = setup();
    act(() => result.current.setName('   '));
    await act(() => result.current.save());
    expect(global.fetch).not.toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe(NAME_REQUIRED);
    expect(result.current.name).toBe('   ');
  });

  it('shows the Ukrainian sentence when the route answers 400', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Name is required' }),
    });
    const { result, refreshUser } = setup();
    act(() => result.current.setName('Олексій'));
    await act(() => result.current.save());
    await waitFor(() => expect(result.current.error).toBe(NAME_REQUIRED));
    expect(refreshUser).not.toHaveBeenCalled();
  });
});
