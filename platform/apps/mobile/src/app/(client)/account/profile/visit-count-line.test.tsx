import { render, screen, waitFor } from '@testing-library/react-native';
import { getAppointments } from '@/lib/api/appointments';
import { makeVisit } from '../appointments/fixtures';
import { ProfileScreen } from './index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/notifications', () => ({
  usePush: () => ({
    token: null,
    permission: null,
    allowed: false,
    register: jest.fn(),
    revoke: jest.fn(),
    error: null,
  }),
}));
jest.mock('@/lib/api/identity', () => ({
  getProfile: jest.fn(async () => ({ name: 'Олена', birthday: null })),
  updateProfileName: jest.fn(),
}));
jest.mock('@/lib/api/appointments', () => ({ getAppointments: jest.fn() }));

const mockedList = getAppointments as jest.MockedFunction<typeof getAppointments>;

describe('ProfileScreen — лічильник візитів (T-4734c)', () => {
  it('показує кількість минулих візитів зі списку візитів', async () => {
    mockedList.mockResolvedValue([
      makeVisit({ id: 'a', status: 'completed' }),
      makeVisit({ id: 'b', status: 'cancelled' }),
      makeVisit({ id: 'c', status: 'upcoming' }),
    ]);
    render(<ProfileScreen />);
    expect(await screen.findByText('Візитів: 2')).toBeTruthy();
  });

  it('нуль видимий, а не прихований', async () => {
    mockedList.mockResolvedValue([makeVisit({ status: 'upcoming' })]);
    render(<ProfileScreen />);
    expect(await screen.findByText('Візитів: 0')).toBeTruthy();
  });

  it('помилка завантаження ховає рядок', async () => {
    mockedList.mockRejectedValue(new Error('API 500'));
    render(<ProfileScreen />);
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    expect(screen.queryByTestId('profile-visit-count')).toBeNull();
  });
});
