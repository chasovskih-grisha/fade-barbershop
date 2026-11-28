// T-4726c: застосунок питає «Як до вас звертатись?» тим самим правилом, що сайт
// (T-4726a): запит лише коли збережене ім'я порожнє, після збереження він зникає,
// а незбережений текст у полі запит не приховує.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getProfile, updateProfileName, type UserProfile } from '@/lib/api/identity';
import { NAME_PROMPT, NamePrompt } from './name-prompt';
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
jest.mock('@/lib/api/client-sessions', () => ({
  getClientSessions: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/api/appointments', () => ({
  getAppointments: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/api/identity', () => ({
  getProfile: jest.fn(),
  updateProfileName: jest.fn(),
}));

const profile = (name: string): UserProfile => ({
  id: 'u1',
  phone: '+380991234567',
  name,
  role: 'client',
  birthday: null,
});

const mockedProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockedUpdate = updateProfileName as jest.MockedFunction<typeof updateProfileName>;

describe('NamePrompt (T-4726c)', () => {
  it('показує запит, коли збережене ім’я порожнє', () => {
    render(<NamePrompt storedName="" />);
    expect(screen.getByText(NAME_PROMPT)).toBeTruthy();
  });

  it('ховає запит, коли ім’я збережене', () => {
    render(<NamePrompt storedName="Олена" />);
    expect(screen.queryByText(NAME_PROMPT)).toBeNull();
  });
});

describe('ProfileScreen — запит імені (T-4726c)', () => {
  it('питає ім’я на профілі без збереженого імені', async () => {
    mockedProfile.mockResolvedValue(profile(''));
    render(<ProfileScreen />);
    expect(await screen.findByText(NAME_PROMPT)).toBeTruthy();
  });

  it('не питає, коли ім’я вже збережене', async () => {
    mockedProfile.mockResolvedValue(profile('Олена'));
    render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByTestId('profile-name-input').props.value).toBe('Олена'));
    expect(screen.queryByText(NAME_PROMPT)).toBeNull();
  });

  it('незбережений текст у полі запит не приховує, збереження — приховує', async () => {
    mockedProfile.mockResolvedValue(profile(''));
    mockedUpdate.mockResolvedValue(profile('Олена'));
    render(<ProfileScreen />);
    fireEvent.changeText(await screen.findByTestId('profile-name-input'), 'Олена');
    expect(screen.getByText(NAME_PROMPT)).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Зберегти ім'я"));

    await waitFor(() => expect(screen.queryByText(NAME_PROMPT)).toBeNull());
  });
});
