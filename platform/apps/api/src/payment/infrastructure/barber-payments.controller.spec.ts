import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentForm } from '../../billing/domain/payment-status.enum';
import type { OnsitePayment } from '../application/onsite-payment.use-case';
import type { BarberDayMoney } from '../application/barber-day-money.use-case';
import { BarberPaymentsController } from './barber-payments.controller';

const request = (userId: string): Request =>
  ({ clientSession: { userId, sessionId: 'session-1' } }) as unknown as Request;

function controller(options: {
  userRole?: string;
  ownerId?: string;
  bookingExists?: boolean;
  source?: string;
  status?: string;
}) {
  const onsite = {
    status: jest.fn(async () => ({ bookingId: 'booking-1', amountDue: 350 })),
    execute: jest.fn(async () => ({
      booking: { id: 'booking-1' },
      outcome: 'captured',
      paidAmount: 350,
      depositAmount: 150,
      audit: { by: 'barber-1' },
    })),
  };
  const bookings = {
    findById: jest.fn(async () =>
      options.bookingExists === false
        ? null
        : {
            id: 'booking-1',
            barberId: options.ownerId ?? 'barber-1',
            source: options.source ?? 'walk_in',
            status: options.status ?? 'completed',
          }
    ),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(async () => ({
        id: 'barber-1',
        role: options.userRole ?? 'barber',
        active: true,
      })),
    },
  };
  return {
    controller: new BarberPaymentsController(
      onsite as unknown as OnsitePayment,
      bookings as never,
      prisma as never,
      { execute: jest.fn(async (_id: string, date: string) => ({ date })) } as unknown as BarberDayMoney
    ),
    onsite,
  };
}

describe('BarberPaymentsController', () => {
  it('reads and marks the barber’s own booking using the session actor', async () => {
    const { controller: c, onsite } = controller({});
    const req = request('barber-1');

    await expect(c.status('booking-1', req)).resolves.toMatchObject({ amountDue: 350 });
    await expect(
      c.pay({ bookingId: 'booking-1', form: PaymentForm.CASH }, req)
    ).resolves.toMatchObject({ outcome: 'captured' });
    expect(onsite.execute).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      form: PaymentForm.CASH,
      by: 'barber-1',
    });
  });

  it('refuses an online visit: its remainder belongs to the admin (PAY-ONS-01)', async () => {
    const { controller: c, onsite } = controller({ source: 'client_web' });

    await expect(
      c.pay({ bookingId: 'booking-1', form: PaymentForm.CASH }, request('barber-1'))
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(onsite.execute).not.toHaveBeenCalled();
  });

  it('refuses a walk-in until the service is completed', async () => {
    const { controller: c, onsite } = controller({ status: 'in_progress' });

    await expect(
      c.pay({ bookingId: 'booking-1', form: PaymentForm.CASH }, request('barber-1'))
    ).rejects.toBeInstanceOf(ConflictException);
    expect(onsite.execute).not.toHaveBeenCalled();
  });

  it('rejects other barbers, clients and missing bookings', async () => {
    await expect(
      controller({ ownerId: 'barber-2' }).controller.status('booking-1', request('barber-1'))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller({ userRole: 'client' }).controller.status('booking-1', request('barber-1'))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller({ bookingExists: false }).controller.status('booking-1', request('barber-1'))
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
