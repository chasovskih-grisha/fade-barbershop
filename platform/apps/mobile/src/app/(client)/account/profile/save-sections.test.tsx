// T-4727c: результат збереження належить секції. Успіх імені лишається на
// екрані, коли падає нотатка, і навпаки — профіль не має одного спільного
// банера, який переписує обидві секції.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  getProfile,
  updateProfileName,
  updateProfilePreferences,
  type UserProfile,
} from '@/lib/api/identity';
import { ProfileScreen } from './index';
import { NAME_SAVE_FAILED, NOTE_SAVE_FAILED, SAVE_CONFIRMED } from './save-sentences';

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
  updateProfilePreferences: jest.fn(),
}));

const profile = getProfile as jest.Mock;
const saveName = updateProfileName as jest.Mock;
const saveNote = updateProfilePreferences as jest.Mock;

const stored: UserProfile = {
  id: 'user-1',
  role: 'client',
  name: 'Олена',
  phone: '+380501112233',
  preferences: ['без парфумів'],
  birthday: null,
};

async function ready() {
  profile.mockResolvedValue(stored);
  render(<ProfileScreen />);
  await waitFor(() => expect(screen.getByDisplayValue('Олена')).toBeTruthy());
}

describe('Профіль — результат збереження в секції (T-4727c)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveName.mockReset();
    saveNote.mockReset();
  });

  it('успіх імені лишається, коли падає збереження нотатки', async () => {
    saveName.mockResolvedValue({ ...stored, name: 'Олена Іваненко' });
    saveNote.mockRejectedValue(new Error('boom'));
    await ready();

    fireEvent.changeText(screen.getByTestId('profile-name-input'), 'Олена Іваненко');
    fireEvent.press(screen.getByText("Зберегти ім'я"));
    await waitFor(() => expect(screen.getByTestId('profile-name-saved')).toBeTruthy());
    expect(screen.getByTestId('profile-name-saved').props.children).toBe(SAVE_CONFIRMED);

    fireEvent.changeText(screen.getByTestId('profile-note-input'), 'без парфумів і лаків');
    fireEvent.press(screen.getByLabelText('Зберегти нотатку'));

    await waitFor(() => expect(screen.getByTestId('profile-note-error')).toBeTruthy());
    expect(screen.getByTestId('profile-note-error').props.children).toBe(NOTE_SAVE_FAILED);
    expect(screen.getByTestId('profile-name-saved').props.children).toBe(SAVE_CONFIRMED);
  });

  it('помилка імені не стирає успіх нотатки', async () => {
    saveName.mockRejectedValue(new Error('boom'));
    saveNote.mockResolvedValue(['коротше з боків']);
    await ready();

    fireEvent.changeText(screen.getByTestId('profile-note-input'), 'коротше з боків');
    fireEvent.press(screen.getByLabelText('Зберегти нотатку'));
    await waitFor(() => expect(screen.getByTestId('profile-note-saved')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('profile-name-input'), 'Олена Іваненко');
    fireEvent.press(screen.getByText("Зберегти ім'я"));

    await waitFor(() => expect(screen.getByTestId('profile-name-error')).toBeTruthy());
    expect(screen.getByTestId('profile-name-error').props.children).toBe(NAME_SAVE_FAILED);
    expect(screen.getByDisplayValue('Олена Іваненко')).toBeTruthy();
    expect(screen.getByTestId('profile-note-saved').props.children).toBe(SAVE_CONFIRMED);
  });
});
