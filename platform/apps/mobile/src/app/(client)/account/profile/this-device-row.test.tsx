import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ClientSession } from '@fade/contracts';
import { router } from 'expo-router';
import { getClientSessions } from '@/lib/api/client-sessions';
import { ThisDeviceRow } from './this-device-row';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/api/client-sessions', () => ({ getClientSessions: jest.fn() }));

const mockedSessions = getClientSessions as jest.MockedFunction<typeof getClientSessions>;

function session(id: string, channel: ClientSession['channel'], current: boolean): ClientSession {
  return { id, channel, createdAt: '2026-11-21T10:00:00.000Z', current };
}

describe('ThisDeviceRow — рядок «Цей пристрій» (T-4724c)', () => {
  it('показує канал поточної сесії та кількість інших пристроїв', async () => {
    mockedSessions.mockResolvedValue([session('s1', 'mobile', true), session('s2', 'web', false)]);
    const { getByText } = render(<ThisDeviceRow />);

    await waitFor(() => expect(getByText('Мобільний застосунок')).toBeTruthy());
    expect(getByText(/Ще 1/)).toBeTruthy();
  });

  it('не показує лічильник, коли інших пристроїв немає', async () => {
    mockedSessions.mockResolvedValue([session('s1', 'web', true)]);
    const { getByText, queryByText } = render(<ThisDeviceRow />);

    await waitFor(() => expect(getByText('Вебсайт')).toBeTruthy());
    expect(queryByText(/^Ще /)).toBeNull();
  });

  it('на помилці лишає посилання без лічильника', async () => {
    mockedSessions.mockRejectedValue(new Error('boom'));
    const { getByText, queryByText } = render(<ThisDeviceRow />);

    await waitFor(() => expect(mockedSessions).toHaveBeenCalled());
    expect(getByText('Цей пристрій')).toBeTruthy();
    expect(queryByText(/^Ще /)).toBeNull();
  });

  it('відкриває наявний екран пристроїв', async () => {
    mockedSessions.mockResolvedValue([]);
    const { getByTestId } = render(<ThisDeviceRow />);
    await waitFor(() => expect(mockedSessions).toHaveBeenCalled());

    fireEvent.press(getByTestId('profile-this-device'));

    expect(router.push).toHaveBeenCalledWith('/(client)/account/devices');
  });
});
