import { fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/api/notification-preferences';
import { NOTIFICATION_DEFAULTS } from '@/lib/notification-preferences';
import { NotificationSwitches } from './notification-switches';

const mockRegister = jest.fn();
const mockRevoke = jest.fn();

jest.mock('@/lib/api/notification-preferences', () => ({
  loadNotificationPreferences: jest.fn(),
  saveNotificationPreferences: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({
  usePush: () => ({ register: mockRegister, revoke: mockRevoke, error: null }),
}));

const load = loadNotificationPreferences as jest.Mock;
const save = saveNotificationPreferences as jest.Mock;
const SAVED = { ...NOTIFICATION_DEFAULTS, smsReminders: true };

describe('NotificationSwitches — push and failures (T-4722c)', () => {
  beforeEach(() => {
    mockRegister.mockReset().mockResolvedValue(undefined);
    mockRevoke.mockReset().mockResolvedValue(undefined);
    load.mockReset().mockResolvedValue(SAVED);
    save.mockReset();
  });

  it('turning push off revokes the device without signing out', async () => {
    const { getByLabelText, queryByText } = render(<NotificationSwitches />);

    await waitFor(() => expect(load).toHaveBeenCalled());
    fireEvent(getByLabelText('Push-сповіщення'), 'valueChange', true);
    fireEvent(getByLabelText('Push-сповіщення'), 'valueChange', false);

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRevoke).toHaveBeenCalledTimes(1);
    expect(queryByText(/Вийти/)).toBeNull();
  });

  it('restores the saved values when the site rejects the save', async () => {
    save.mockRejectedValue(new Error('offline'));
    const { getByLabelText, getByText } = render(<NotificationSwitches />);

    await waitFor(() => expect(load).toHaveBeenCalled());
    fireEvent(getByLabelText('SMS-нагадування'), 'valueChange', false);
    fireEvent.press(getByLabelText('Зберегти налаштування сповіщень'));

    await waitFor(() => expect(getByText('Помилка збереження. Спробуйте ще раз.')).toBeTruthy());
    expect(getByLabelText('SMS-нагадування').props.value).toBe(true);
  });
});
