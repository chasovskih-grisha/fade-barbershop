/* eslint-disable max-lines -- booking page scenarios share one render harness */
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

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace }),
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

const slots = jest.mocked(bookingApi.fetchBookingSlots);
const createBooking = jest.mocked(bookingApi.createBooking);
const payDeposit = jest.mocked(bookingApi.payBookingDeposit);
const depositStatus = jest.mocked(bookingApi.fetchDepositStatus);

async function selectServiceBarberAndSlot() {
  render(<BookingScreen />);
  await waitFor(() => expect(screen.getByText('Стрижка')).toBeTruthy());
  fireEvent.press(screen.getByText('Стрижка'));
  await waitFor(() => expect(screen.getByText('Олександр')).toBeTruthy());
  fireEvent.press(screen.getByText('Олександр'));
  await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeTruthy());
  fireEvent.press(screen.getByText('10:00–11:00'));
  await waitFor(() => expect(screen.getByText('Підтвердити запис')).toBeTruthy());
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([bookingLocation]);
  jest.spyOn(barbersApi, 'fetchBarbers').mockResolvedValue([bookingBarber]);
  jest.mocked(bookingApi.fetchBookingServices).mockResolvedValue([bookingService]);
  slots.mockResolvedValue([bookingSlot]);
  createBooking.mockResolvedValue(depositBooking());
  payDeposit.mockResolvedValue({
    bookingId: 'booking-1',
    outcome: 'captured',
    paymentId: null,
    depositAmount: 210,
    requiresBalance: false,
    receiptId: null,
    failureReason: null,
  });
  depositStatus.mockResolvedValue({
    bookingId: 'booking-1',
    outcome: 'captured',
    paymentId: null,
    depositAmount: 210,
    requiresBalance: false,
    receiptId: null,
    failureReason: null,
  });
});

describe('mobile booking screen', () => {
  it('confirms service, barber and slot, then captures the deposit', async () => {
    await selectServiceBarberAndSlot();
    fireEvent.press(screen.getByText('Підтвердити запис'));

    await waitFor(() => expect(screen.getByText('Депозит 210 ₴')).toBeTruthy());
    expect(createBooking).toHaveBeenCalledWith({
      locationId: 'loc-1',
      serviceId: 'svc-1',
      date: expect.any(String),
      start: '10:00',
      end: '11:00',
      barberId: 'barber-1',
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Сплатити 210 ₴'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() => expect(screen.getByText('Вас записано')).toBeTruthy());
    expect(payDeposit).toHaveBeenCalledWith('booking-1', expect.any(String));
    expect(screen.getByText('Депозит сплачено.')).toBeTruthy();
  });

  it('confirms a visit without requesting a deposit', async () => {
    createBooking.mockResolvedValueOnce({ id: 'booking-1' });
    await selectServiceBarberAndSlot();
    fireEvent.press(screen.getByText('Підтвердити запис'));

    await waitFor(() =>
      expect(screen.getByText('Запис підтверджено. Депозит не потрібен.')).toBeTruthy()
    );
    expect(payDeposit).not.toHaveBeenCalled();
    expect(screen.queryByText('Депозит сплачено.')).toBeNull();
  });

  it('hides payment when the server hold already expired', async () => {
    createBooking.mockResolvedValueOnce(depositBooking(-60_000));
    await selectServiceBarberAndSlot();
    fireEvent.press(screen.getByText('Підтвердити запис'));

    await waitFor(() => expect(screen.getByText('Час на оплату минув')).toBeTruthy());
    expect(screen.getByText('Місце звільнено. Кошти не списано.')).toBeTruthy();
    expect(screen.queryByText('Сплатити 210 ₴')).toBeNull();

    fireEvent.press(screen.getByText('Обрати інший час'));
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeTruthy());
    expect(slots).toHaveBeenCalledTimes(2);
  });

  it('refreshes slots and keeps service/barber when confirmation conflicts', async () => {
    createBooking.mockRejectedValueOnce(new Error('API error 409'));
    await selectServiceBarberAndSlot();
    fireEvent.press(screen.getByText('Підтвердити запис'));

    await waitFor(() =>
      expect(screen.getByText('Цей час щойно зайняли. Оберіть інший слот.')).toBeTruthy()
    );
    expect(screen.getByText('Показати слоти')).toBeTruthy();
    expect(slots).toHaveBeenCalledTimes(2);
  });

  it('renders services when the barber directory request fails', async () => {
    jest.spyOn(barbersApi, 'fetchBarbers').mockRejectedValueOnce(new Error('Майстри недоступні'));

    render(<BookingScreen />);

    await waitFor(() => expect(screen.getByText('Стрижка')).toBeTruthy());
    expect(screen.getByText('Майстри недоступні')).toBeTruthy();
  });

  it('shows an error when slot loading fails', async () => {
    slots.mockRejectedValueOnce(new Error('Не вдалося завантажити слоти'));
    render(<BookingScreen />);
    await waitFor(() => expect(screen.getByText('Стрижка')).toBeTruthy());
    fireEvent.press(screen.getByText('Стрижка'));
    await waitFor(() => expect(screen.getByText('Будь-який майстер')).toBeTruthy());
    fireEvent.press(screen.getByText('Будь-який майстер'));

    await waitFor(() => expect(screen.getByText('Не вдалося завантажити слоти')).toBeTruthy());
  });
});
