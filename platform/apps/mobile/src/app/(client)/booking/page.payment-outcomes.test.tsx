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

const createBooking = jest.mocked(bookingApi.createBooking);
const payDeposit = jest.mocked(bookingApi.payBookingDeposit);
const depositStatus = jest.mocked(bookingApi.fetchDepositStatus);

async function reachPayment() {
  render(<BookingScreen />);
  await waitFor(() => expect(screen.getByText('Стрижка')).toBeTruthy());
  fireEvent.press(screen.getByText('Стрижка'));
  await waitFor(() => expect(screen.getByText('Олександр')).toBeTruthy());
  fireEvent.press(screen.getByText('Олександр'));
  await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeTruthy());
  fireEvent.press(screen.getByText('10:00–11:00'));
  await waitFor(() => expect(screen.getByText('Підтвердити запис')).toBeTruthy());
  fireEvent.press(screen.getByText('Підтвердити запис'));
  await waitFor(() => expect(screen.getByText('Депозит 210 ₴')).toBeTruthy());
  await act(async () => {
    fireEvent.press(screen.getByText('Сплатити 210 ₴'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function payment(outcome: bookingApi.DepositPayment['outcome']): bookingApi.DepositPayment {
  return {
    bookingId: 'booking-1',
    outcome,
    paymentId: null,
    depositAmount: 210,
    requiresBalance: false,
    receiptId: null,
    failureReason: outcome === 'captured' || outcome === 'already_paid' ? null : outcome,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([bookingLocation]);
  jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValue([bookingBarber]);
  jest.mocked(bookingApi.fetchBookingServices).mockResolvedValue([bookingService]);
  jest.mocked(bookingApi.fetchBookingSlots).mockResolvedValue([bookingSlot]);
  createBooking.mockResolvedValue(depositBooking());
  payDeposit.mockResolvedValue(payment('captured'));
  depositStatus.mockResolvedValue(payment('captured'));
});

describe('mobile booking deposit outcomes', () => {
  it('reports an already paid deposit after a retried payment', async () => {
    payDeposit.mockResolvedValueOnce(payment('already_paid'));
    await reachPayment();
    await waitFor(() => expect(screen.getByText('Депозит уже сплачено.')).toBeTruthy());
  });

  it('reports an expired deposit returned by the payment endpoint', async () => {
    payDeposit.mockResolvedValueOnce(payment('expired'));
    await reachPayment();
    await waitFor(() => expect(screen.getByText('Час на оплату депозиту минув')).toBeTruthy());
    expect(screen.queryByText('Вас записано')).toBeNull();
  });

  it('keeps the payment screen when the acquirer declines the deposit', async () => {
    payDeposit.mockResolvedValueOnce(payment('failed'));
    await reachPayment();
    await waitFor(() =>
      expect(
        screen.getByText('Кошти не списані. Спробуйте ще раз або оберіть інший час.')
      ).toBeTruthy()
    );
    expect(screen.queryByText('Вас записано')).toBeNull();
  });

  it('reconciles a lost POST response through the deposit status route', async () => {
    payDeposit.mockRejectedValueOnce(new Error('network'));
    depositStatus.mockResolvedValueOnce(payment('captured'));
    await reachPayment();

    await waitFor(() => expect(screen.getByText('Вас записано')).toBeTruthy());
    expect(depositStatus).toHaveBeenCalledWith('booking-1', 'resume-booking-1');
  });
});
