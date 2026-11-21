// PAY-ADM-09: запис снепшотить політику депозиту з адмін-налаштувань, а не
// константи в коді; без порту лишаються дефолти (30% / 10 грн / 4 год).
import { Booking } from '../domain/booking';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import {
  FakeBookingRepository,
  FakeScheduleRepo,
  makeOpeningHours,
  slotOf,
} from './book-appointment.fakes';

const date = '2026-10-05';
const schedule = BarberSchedule.create({
  barberId: 'b1',
  locationId: 'loc1',
  windows: [{ dayOfWeek: 0, start: '09:00', end: '18:00' }],
});

async function book(depositPolicy?: { get: () => Promise<never> | Promise<unknown> }) {
  const repo = new FakeBookingRepository();
  const useCase = new BookAppointment({
    bookingRepo: repo,
    scheduleRepo: new FakeScheduleRepo([schedule]),
    openingHours: makeOpeningHours(0, '08:00', '20:00'),
    serviceDuration: 30,
    serviceSnapshot: { serviceId: 'cut', agreedPrice: 700 },
    ...(depositPolicy ? { depositPolicy: depositPolicy as never } : {}),
  });
  await useCase.execute('', 'loc1', slotOf('13:00', '13:30', date));
  const [booking] = repo.bookings;
  if (!booking) throw new Error('Запис не створено');
  return booking as Booking;
}

describe('BookAppointment і політика депозиту', () => {
  it('снепшотить налаштовану політику', async () => {
    const booking = await book({
      get: async () => ({ percent: 50, rounding: 5, cancellationWindowHours: 2 }),
    });

    expect(booking.deposit).toEqual({
      amount: 350, // 50% від 700, округлення до 5
      percent: 50,
      rounding: 5,
      cancellationWindowHours: 2,
    });
  });

  it('нульовий відсоток у налаштуваннях означає «без депозиту»', async () => {
    const booking = await book({
      get: async () => ({ percent: 0, rounding: 10, cancellationWindowHours: 4 }),
    });

    expect(booking.deposit).toBeNull();
  });

  it('без порту лишаються дефолти PAY-ADM-09', async () => {
    const booking = await book();

    expect(booking.deposit).toEqual({
      amount: 210,
      percent: 30,
      rounding: 10,
      cancellationWindowHours: 4,
    });
  });
});
