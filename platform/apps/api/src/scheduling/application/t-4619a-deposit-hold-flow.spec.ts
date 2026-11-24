/* eslint-disable max-lines -- cohesive module (131 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4619a: наскрізна проводка утримання крісла — запис із депозитом створює
// DepositHold, оплата в межах вікна його підтверджує, пізня оплата відмовляє,
// sweeper звільняє крісло і слоти знову його віддають.
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import {
  FakeBookingRepository,
  FakeScheduleRepo,
  makeOpeningHours,
  slotOf,
} from './book-appointment.fakes';
import { DepositHoldService, InMemoryDepositHoldRepository } from './deposit-hold.service';
import {
  DepositFlow,
  InMemoryAppointmentPaymentRepository,
  InMemoryBookingPaymentRepository,
} from '../../payment/application/deposit-flow.use-case';
import { makeSlots } from '../../booking/infrastructure/available-slots.fakes';
import { PaymentStatus } from '../../billing/domain/payment-status.enum';
import type { Booking } from '../domain/booking';

const date = '2026-10-05';
const schedule = BarberSchedule.create({
  barberId: 'b1',
  locationId: 'loc1',
  windows: [{ dayOfWeek: 0, start: '09:00', end: '18:00' }],
});

async function bookDeposit(price = 700) {
  const repository = new InMemoryDepositHoldRepository();
  const holds = new DepositHoldService(repository);
  const bookings = new FakeBookingRepository();
  const useCase = new BookAppointment({
    bookingRepo: bookings,
    scheduleRepo: new FakeScheduleRepo([schedule]),
    openingHours: makeOpeningHours(0, '08:00', '20:00'),
    serviceDuration: 30,
    serviceSnapshot: { serviceId: 'cut', agreedPrice: price },
    depositHolds: holds,
  });

  await useCase.execute('', 'loc1', slotOf('13:00', '13:30', date));
  const booking = bookings.bookings[0];
  if (!booking) throw new Error('Запис не створено');
  return { booking, holds, repository };
}

async function holdFor(repository: InMemoryDepositHoldRepository, appointmentId: string) {
  const hold = await repository.findByAppointmentId(appointmentId);
  if (!hold) throw new Error('Deposit hold expected');
  return hold;
}

function depositFlow(booking: Booking, holds: DepositHoldService, now: Date) {
  const payments = new InMemoryAppointmentPaymentRepository();
  const bookings = new InMemoryBookingPaymentRepository([booking]);
  const charges: number[] = [];
  const flow = new DepositFlow({
    payments,
    bookings,
    gateway: {
      capture: async (_paymentId, amount) => {
        charges.push(amount);
        return true;
      },
    },
    holds,
    clock: { now: () => now },
  });
  return { flow, charges };
}

describe('T-4619a deposit hold flow', () => {
  it('creates a hold for a visit that awaits a deposit', async () => {
    const { booking, repository } = await bookDeposit();

    const hold = await repository.findByAppointmentId(booking.id);
    expect(hold).not.toBeNull();
    if (!hold) throw new Error('Deposit hold expected');
    expect(hold).toMatchObject({
      appointmentId: booking.id,
      barberId: 'b1',
      locationId: 'loc1',
      depositAmount: 210,
      status: 'active',
    });
    expect(hold.expiresAt.getTime() - hold.createdAt.getTime()).toBe(15 * 60_000);
  });

  it('does not hold a chair for a complimentary visit (PAY-003)', async () => {
    const { booking, repository } = await bookDeposit(0);

    expect(await repository.findByAppointmentId(booking.id)).toBeNull();
  });

  it('captures the hold when the deposit is paid inside the window', async () => {
    const { booking, holds, repository } = await bookDeposit();
    const hold = await holdFor(repository, booking.id);
    const { flow, charges } = depositFlow(
      booking,
      holds,
      new Date(hold.createdAt.getTime() + 60_000)
    );

    const result = await flow.execute(booking.id);

    expect(result.outcome).toBe('captured');
    expect(charges).toEqual([210]);
    expect(result.booking.depositStatus).toBe('captured');
    expect(result.booking.status).toBe('confirmed');
    expect((await holdFor(repository, booking.id)).status).toBe('captured');
  });

  it('refuses a deposit that arrives after expiry without charging', async () => {
    const { booking, holds, repository } = await bookDeposit();
    const hold = await holdFor(repository, booking.id);
    const late = new Date(hold.expiresAt.getTime() + 60_000);
    const { flow, charges } = depositFlow(booking, holds, late);

    const result = await flow.execute(booking.id);

    expect(result.outcome).toBe('expired');
    expect(result.failureReason).toBe('deposit_hold_expired');
    expect(charges).toEqual([]);
    expect(result.booking.depositStatus).toBe('expired');
    expect((await holdFor(repository, booking.id)).status).toBe('expired');
  });

  it('refuses to charge when the appointment has no hold', async () => {
    const { booking } = await bookDeposit();
    const emptyHolds = new DepositHoldService(new InMemoryDepositHoldRepository());
    const now = new Date(Date.now() + 60_000);
    const { flow, charges } = depositFlow(booking, emptyHolds, now);

    const result = await flow.execute(booking.id);

    expect(result.outcome).toBe('expired');
    expect(result.failureReason).toBe('deposit_hold_missing');
    expect(charges).toEqual([]);
    expect(result.booking.depositStatus).toBe('expired');
  });

  it('releases the hold when acquiring declines so the chair is not blocked', async () => {
    const { booking, holds, repository } = await bookDeposit();
    const hold = await holdFor(repository, booking.id);
    const now = new Date(hold.createdAt.getTime() + 60_000);
    const payments = new InMemoryAppointmentPaymentRepository();
    const bookings = new InMemoryBookingPaymentRepository([booking]);
    const flow = new DepositFlow({
      payments,
      bookings,
      gateway: { capture: async () => false },
      holds,
      clock: { now: () => now },
    });

    const declined = await flow.execute(booking.id);
    expect(declined.outcome).toBe('failed');
    expect((await holdFor(repository, booking.id)).status).toBe('cancelled');
    expect(declined.booking.depositStatus).toBe('failed');

    // Після звільнення крісло вже не наше: повтор не списує гроші.
    const retried = await flow.execute(booking.id);
    expect(retried.outcome).toBe('expired');
    expect(retried.failureReason).toBe('deposit_hold_cancelled');
  });

  it('releases the hold when acquiring errors so the chair is not blocked', async () => {
    const { booking, holds, repository } = await bookDeposit();
    const hold = await holdFor(repository, booking.id);
    const now = new Date(hold.createdAt.getTime() + 60_000);
    const flow = new DepositFlow({
      payments: new InMemoryAppointmentPaymentRepository(),
      bookings: new InMemoryBookingPaymentRepository([booking]),
      gateway: {
        capture: async () => {
          throw new Error('acquirer timeout');
        },
      },
      holds,
      clock: { now: () => now },
    });

    const failed = await flow.execute(booking.id);

    expect(failed.outcome).toBe('failed');
    expect(failed.failureReason).toContain('acquirer timeout');
    expect((await holdFor(repository, booking.id)).status).toBe('cancelled');
  });

  it('does not confirm a capture that races past the hold window', async () => {
    const { booking } = await bookDeposit();
    const payments = new InMemoryAppointmentPaymentRepository();
    const bookings = new InMemoryBookingPaymentRepository([booking]);
    const charges: number[] = [];
    const refunds: Array<{ bookingId: string; paymentId: string; amount: number }> = [];
    const flow = new DepositFlow({
      payments,
      bookings,
      gateway: {
        capture: async (_paymentId, amount) => {
          charges.push(amount);
          return true;
        },
      },
      // Вікно минуло між перевіркою і списанням: sweeper вже звільнив крісло.
      holds: {
        status: async () => 'active',
        capture: async () => ({ outcome: 'expired' }),
        release: async () => false,
      },
      lateCaptureRefunds: {
        refundLateCapture: async (input) => {
          refunds.push(input);
          return { status: 'completed', refundId: 'refund-late-1' };
        },
      },
      clock: { now: () => new Date('2026-10-05T12:20:00.000Z') },
    });

    const result = await flow.execute(booking.id);

    expect(charges).toEqual([210]);
    expect(result.outcome).toBe('expired');
    expect(result.failureReason).toBe('deposit_hold_expired_after_capture');
    expect(result.booking.depositStatus).toBe('expired');
    // Гроші вже списані: платіж лишається оплаченим, щоб його можна було повернути.
    expect(result.payment?.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(result.depositAmount).toBe(210);
    expect(refunds).toEqual([
      { bookingId: booking.id, paymentId: result.payment?.id, amount: 210 },
    ]);
    expect(result.refund).toEqual({ status: 'completed', refundId: 'refund-late-1' });
  });

  it('surfaces a failed late-capture refund without hiding the captured payment', async () => {
    const { booking } = await bookDeposit();
    const flow = new DepositFlow({
      payments: new InMemoryAppointmentPaymentRepository(),
      bookings: new InMemoryBookingPaymentRepository([booking]),
      gateway: { capture: async () => true },
      holds: {
        status: async () => 'active',
        capture: async () => ({ outcome: 'expired' }),
        release: async () => false,
      },
      lateCaptureRefunds: {
        refundLateCapture: async () => {
          throw new Error('provider timeout');
        },
      },
      clock: { now: () => new Date('2026-10-05T12:20:00.000Z') },
    });

    const result = await flow.execute(booking.id);

    expect(result.refund).toEqual({ status: 'failed', failureReason: 'provider timeout' });
    expect(result.payment?.status).toBe(PaymentStatus.DEPOSIT_PAID);
  });

  it('does not confirm when the hold disappears between the check and capture', async () => {
    const { booking } = await bookDeposit();
    const payments = new InMemoryAppointmentPaymentRepository();
    const bookings = new InMemoryBookingPaymentRepository([booking]);
    const charges: number[] = [];
    const flow = new DepositFlow({
      payments,
      bookings,
      gateway: {
        capture: async (_paymentId, amount) => {
          charges.push(amount);
          return true;
        },
      },
      holds: {
        status: async () => 'active',
        capture: async () => ({ outcome: 'missing' }),
        release: async () => false,
      },
      clock: { now: () => new Date('2026-10-05T12:20:00.000Z') },
    });

    const result = await flow.execute(booking.id);

    expect(charges).toEqual([210]);
    expect(result.outcome).toBe('expired');
    expect(result.failureReason).toBe('deposit_hold_missing_after_capture');
    expect(result.booking.depositStatus).toBe('expired');
    expect(result.payment?.status).toBe(PaymentStatus.DEPOSIT_PAID);
  });

  it('sweeps the expired hold and offers the chair to slot search again', async () => {
    const { booking, holds, repository } = await bookDeposit();
    const hold = await holdFor(repository, booking.id);
    const later = new Date(hold.expiresAt.getTime() + 60_000);

    // До sweeper-а слоти вже вільні: утримання прострочене на читанні.
    const before = await makeSlots({
      bookings: [booking],
      released: [...(await holds.releasedAppointmentIds(later))],
      now: '2026-10-04T12:00:00.000Z',
    }).handle({ locationId: 'loc1', date, serviceId: 'service-1' });
    expect(before.find((slot) => slot.start === '13:00')?.barbers).toContain('b1');

    expect(await holds.sweep(later)).toHaveLength(1);
    expect(await holds.sweep(later)).toEqual([]);
    expect((await holdFor(repository, booking.id)).status).toBe('expired');
    expect(await holds.releasedAppointmentIds(later)).toEqual(new Set([booking.id]));
  });

  it('keeps the chair blocked before the window ends', async () => {
    const { booking, holds } = await bookDeposit();
    const early = new Date(Date.now() + 5 * 60_000);

    expect(await holds.releasedAppointmentIds(early)).toEqual(new Set());
    expect(await holds.sweep(early)).toEqual([]);
    expect(booking.depositStatus).not.toBe('expired');
  });
});
