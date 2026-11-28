import { fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/api/notification-preferences';
import { NOTIFICATION_DEFAULTS } from '@/lib/notification-preferences';
import { NotificationSwitches } from './notification-switches';

jest.mock('@/lib/api/notification-preferences', () => ({
  loadNotificationPreferences: jest.fn(),
  saveNotificationPreferences: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({
  usePush: () => ({ register: jest.fn(), revoke: jest.fn(), error: null }),
}));

const load = loadNotificationPreferences as jest.Mock;
const save = saveNotificationPreferences as jest.Mock;
const SAVED = { ...NOTIFICATION_DEFAULTS, emailUpdates: false, marketingOffers: true };

describe('NotificationSwitches (T-4722c)', () => {
  beforeEach(() => {
    load.mockReset().mockResolvedValue(SAVED);
    save.mockReset();
  });

  it('shows the four switches from the site', async () => {
    const { getByText, getByLabelText } = render(<NotificationSwitches />);

    for (const label of [
      'SMS-нагадування',
      'Email-підтвердження',
      'Push-сповіщення',
      'Маркетингові пропозиції',
    ]) {
      expect(getByText(label)).toBeTruthy();
      expect(getByLabelText(label)).toBeTruthy();
    }
    await waitFor(() => expect(load).toHaveBeenCalled());
  });

  it('shows the values the site stored', async () => {
    const { getByLabelText } = render(<NotificationSwitches />);

    await waitFor(() => expect(getByLabelText('Email-підтвердження').props.value).toBe(false));
    expect(getByLabelText('Маркетингові пропозиції').props.value).toBe(true);
  });

  it('saves the four switches in the site shape', async () => {
    save.mockResolvedValue(SAVED);
    const { getByLabelText } = render(<NotificationSwitches />);

    await waitFor(() => expect(load).toHaveBeenCalled());
    fireEvent(getByLabelText('Маркетингові пропозиції'), 'valueChange', false);
    fireEvent.press(getByLabelText('Зберегти налаштування сповіщень'));

    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...SAVED, marketingOffers: false }));
  });
});
