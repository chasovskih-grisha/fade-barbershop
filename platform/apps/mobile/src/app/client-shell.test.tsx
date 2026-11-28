import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import IndexPage from './index';

let resolveLocations: (val: any) => void = () => {};
let resolveServices: (val: any) => void = () => {};

jest.mock('../lib/api/locations', () => ({
  fetchLocations: jest.fn(
    () =>
      new Promise((res) => {
        resolveLocations = res;
      })
  ),
}));

jest.mock('../lib/api/catalog', () => ({
  fetchServices: jest.fn(
    () =>
      new Promise((res) => {
        resolveServices = res;
      })
  ),
}));

jest.mock('../lib/api/identity', () => ({
  requestOtp: jest.fn(async () => {}),
  verifyOtp: jest.fn(async () => ({ accessToken: 'token-123' })),
}));

jest.mock('../lib/api/push-tokens', () => ({
  registerPushToken: jest.fn(async () => {}),
}));

// T-070 (реopened): push-токен більше не реєструється відразу на старті —
// тільки після створення сесії. Тому в тесті підмінюємо хук реєстрації,
// а не реальний expo-notifications, і перевіряємо, коли екран викликає register.
const mockPushRegister = jest.fn(async () => {});
const mockPushRevoke = jest.fn(async () => {});
let mockPushError: string | null = null;
jest.mock('../lib/use-push-registration', () => ({
  usePushRegistration: () => ({
    register: mockPushRegister,
    revoke: mockPushRevoke,
    error: mockPushError,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('T-070: Mobile Shell, Login, Push Tokens & API Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders brand lockup with FADE accessibility label', () => {
    render(<IndexPage />);
    expect(screen.getByTestId('brand-lockup')).toBeTruthy();
    expect(screen.getByLabelText('FADE')).toBeTruthy();
    expect(screen.getByText('FADE')).toBeTruthy();
  });

  it('shows loading skeletons while locations/services load, then renders API data', async () => {
    render(<IndexPage />);

    expect(screen.getByTestId('home-cards-skeleton')).toBeTruthy();

    await act(async () => {
      resolveLocations([
        { id: 'l1', code: 'center', name: 'Центр', address: 'Тепла, 5', active: true },
      ]);
      resolveServices([
        { id: 's1', name: 'Стрижка', price: 700, durationMinutes: 40, active: true },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('Центр')).toBeTruthy();
      expect(screen.getByText('Тепла, 5')).toBeTruthy();
      expect(screen.getByText('Стрижка')).toBeTruthy();
    });
  });

  it('shows spinner and disabled button while OTP login submit is in flight', async () => {
    render(<IndexPage />);

    const loginTab = screen.getByText('Вхід');
    fireEvent.press(loginTab);

    const phoneInput = screen.getByLabelText('Телефон');
    fireEvent.changeText(phoneInput, '+380501234567');
    const submitBtn = screen.getByRole('button', { name: 'Отримати код' });

    fireEvent.press(submitBtn);

    expect(submitBtn.props.accessibilityState?.disabled || submitBtn.props.disabled).toBeTruthy();
    expect(screen.getByTestId('submit-spinner')).toBeTruthy();
  });

  it('home shows the push permission state instead of hiding it (T-070)', () => {
    mockPushError = 'Сповіщення вимкнено на цьому пристрої';
    try {
      render(<IndexPage />);
      expect(screen.getByTestId('push-permission-notice')).toBeTruthy();
      expect(screen.getByText('Увімкнути сповіщення')).toBeTruthy();
    } finally {
      mockPushError = null;
    }
  });

  it('registers the push token for the current session', async () => {
    render(<IndexPage />);

    // Сесія є → register отримує саме її токен, а не мок без сесії.
    await waitFor(() => {
      expect(mockPushRegister).toHaveBeenCalledWith('token-123');
    });
  });
});
