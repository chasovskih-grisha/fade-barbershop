import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SignOutCard } from './sign-out-card';
import { readSession, readSignInRequested, writeSession } from '@/lib/session-store';
import { revokePushToken } from '@/lib/api/push';
import { revokeAllSessions } from '@/lib/api/client-sessions';

jest.mock('@/lib/api/push', () => ({ revokePushToken: jest.fn() }));
jest.mock('@/lib/api/client-sessions', () => ({ revokeAllSessions: jest.fn() }));

describe('SignOutCard — вихід з профілю застосунку (T-4723c)', () => {
  beforeEach(() => {
    writeSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    jest.clearAllMocks();
  });

  it('показує «Вийти» окремим контролом', () => {
    const { getByTestId } = render(<SignOutCard />);
    expect(getByTestId('profile-sign-out-trigger')).toBeTruthy();
  });

  it('питає «Вийти з цього пристрою?» перед виходом', () => {
    const { getByTestId, getByText } = render(<SignOutCard />);
    fireEvent.press(getByTestId('profile-sign-out-trigger'));
    expect(getByText('Вийти з цього пристрою?')).toBeTruthy();
  });

  it('«Скасувати» лишає сесію', () => {
    const { getByTestId } = render(<SignOutCard />);
    fireEvent.press(getByTestId('profile-sign-out-trigger'));
    fireEvent.press(getByTestId('profile-sign-out-cancel'));
    expect(readSession()).not.toBeNull();
    expect(readSignInRequested()).toBe(false);
  });

  it('підтвердження гасить локальну сесію і відкриває вхід', async () => {
    const { getByTestId } = render(<SignOutCard />);
    fireEvent.press(getByTestId('profile-sign-out-trigger'));
    fireEvent.press(getByTestId('profile-sign-out-confirm-yes'));
    await waitFor(() => expect(readSession()).toBeNull());
    expect(readSignInRequested()).toBe(true);
  });

  it('не робить revoke-all і не знімає push-токен', async () => {
    const { getByTestId } = render(<SignOutCard />);
    fireEvent.press(getByTestId('profile-sign-out-trigger'));
    fireEvent.press(getByTestId('profile-sign-out-confirm-yes'));
    await waitFor(() => expect(readSession()).toBeNull());
    expect(revokeAllSessions).not.toHaveBeenCalled();
    expect(revokePushToken).not.toHaveBeenCalled();
  });
});
