import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import BookingScreen from './page';
import * as bookingApi from '../../../lib/api/booking';
import * as barbersApi from '../../../lib/api/barbers';
import * as locationsApi from '../../../lib/api/locations';
import {
  bookingBarber,
  bookingLocation,
  bookingService,
  bookingSlot,
  depositBooking,
} from './booking-test-fixtures';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('../../../lib/api/locations');
jest.mock('../../../lib/api/barbers');
jest.mock('../../../lib/api/booking', () => ({
  ...jest.requireActual('../../../lib/api/booking'),
  fetchBookingServices: jest.fn(),
  fetchBookingSlots: jest.fn(),
  createBooking: jest.fn(),
  payBookingDeposit: jest.fn(),
  fetchDepositStatus: jest.fn(),
}));

const payDeposit = jest.mocked(bookingApi.payBookingDeposit);
const depositStatus = jest.mocked(bookingApi.fetchDepositStatus);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([bookingLocation]);
  jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValue([bookingBarber]);
  jest.mocked(bookingApi.fetchBookingServices).mockResolvedValue([bookingService]);
  jest.mocked(bookingApi.fetchBookingSlots).mockResolvedValue([bookingSlot]);
  jest.mocked(bookingApi.createBooking).mockResolvedValue(depositBooking());
});

it('keeps the visit unpaid when reconciliation reports a pending hold', async () => {
  payDeposit.mockRejectedValueOnce(new Error('network'));
  depositStatus.mockResolvedValueOnce({
    bookingId: 'booking-1',
    outcome: 'pending',
    paymentId: null,
    depositAmount: 210,
    requiresBalance: false,
    receiptId: null,
    failureReason: null,
  });
  render(<BookingScreen />);
  await waitFor(() => expect(screen.getByText('Стрижка')).toBeTruthy());
  fireEvent.press(screen.getByText('Стрижка'));
  await waitFor(() => expect(screen.getByText('Олександр')).toBeTruthy());
  fireEvent.press(screen.getByText('Олександр'));
  await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeTruthy());
  fireEvent.press(screen.getByText('10:00–11:00'));
  fireEvent.press(await screen.findByText('Підтвердити запис'));
  await act(async () => {
    fireEvent.press(await screen.findByText('Сплатити 210 ₴'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await waitFor(() =>
    expect(
      screen.getByText('Невідомий результат оплати. Перевірте списання перед повтором.')
    ).toBeTruthy()
  );
  expect(screen.queryByText('Вас записано')).toBeNull();
});
