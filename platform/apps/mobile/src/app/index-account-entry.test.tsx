import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import IndexPage from './index';

const mockPush = jest.fn();

jest.mock('../lib/api/locations', () => ({
  fetchLocations: jest.fn(async () => []),
}));

jest.mock('../lib/api/catalog', () => ({
  fetchServices: jest.fn(async () => []),
}));

jest.mock('../lib/api/identity', () => ({
  requestOtp: jest.fn(async () => {}),
  verifyOtp: jest.fn(async () => ({ accessToken: 'token-123' })),
}));

jest.mock('../lib/api/push-tokens', () => ({
  registerPushToken: jest.fn(async () => {}),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('T-4717b: account control on the app home', () => {
  beforeEach(() => mockPush.mockClear());

  it('signed out, the control reads «Вхід» and opens the login form', async () => {
    render(<IndexPage />);
    const entry = screen.getByText('Вхід');
    fireEvent.press(entry);
    expect(screen.getByLabelText('Телефон')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('after sign-in, the control reads «Кабінет» and opens the visits screen', async () => {
    render(<IndexPage />);

    fireEvent.press(screen.getByText('Вхід'));
    fireEvent.changeText(screen.getByLabelText('Телефон'), '+380501234567');
    fireEvent.press(screen.getByRole('button', { name: 'Отримати код' }));

    const account = await screen.findByText('Кабінет');
    expect(screen.queryByText('Вхід')).toBeNull();

    fireEvent.press(account);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/(client)/account/appointments'));
  });
});
