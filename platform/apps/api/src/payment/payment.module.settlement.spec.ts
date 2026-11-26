// T-4616b: контролер недоступності отримує BarberCancelSettlement зі справжньої
// збірки PaymentModule. Якщо провайдер зникне, компіляція модуля впаде — тест
// не може пройти «тихим» пропуском settlement.
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { AdminBarberUnavailabilityController } from '../scheduling/infrastructure/admin-barber-unavailability.controller';
import { ResolveShiftConflict } from '../scheduling/application/resolve-shift-conflict.use-case';
import { DepositHoldService } from '../scheduling/application/deposit-hold.service';
import { PaymentStatus } from '../billing/domain/payment-status.enum';
import { BarberCancelSettlement } from './application/barber-cancel-settlement.use-case';
import { T094Refund } from './application/refund.use-case';
import {
  APPOINTMENT_PAYMENT_REPOSITORY,
  BOOKING_PAYMENT_REPOSITORY,
  PaymentModule,
} from './payment.module';

const request = { adminUserId: 'founder-1' } as unknown as Request;

type Outcomes = Awaited<ReturnType<ResolveShiftConflict['executeMany']>>;

async function bootModule(outcomes: Outcomes) {
  const refund = jest.fn(async (bookingId: string) => ({
    refund: { refundId: `refund_${bookingId}`, status: 'completed', amount: 300 },
    isDuplicate: false,
  }));
  const moduleRef = await Test.createTestingModule({ imports: [PaymentModule] })
    // Візит без попереднього повернення; гроші — один списаний депозит 300.
    .overrideProvider(BOOKING_PAYMENT_REPOSITORY)
    .useValue({ findById: async () => ({ refundId: null }), save: async () => undefined })
    .overrideProvider(APPOINTMENT_PAYMENT_REPOSITORY)
    .useValue({
      findByAppointmentId: async () => [{ amount: 300, status: PaymentStatus.DEPOSIT_PAID }],
    })
    .overrideProvider(T094Refund)
    .useValue({ initiateRefund: refund })
    .overrideProvider(DepositHoldService)
    .useValue({ release: async () => true })
    // Межа, що не є предметом тесту: рішення по конфлікту вже перевірене окремо.
    .overrideProvider(ResolveShiftConflict)
    .useValue({ execute: jest.fn(), executeMany: jest.fn(async () => outcomes) })
    .compile();
  return { moduleRef, refund };
}

describe('PaymentModule → AdminBarberUnavailabilityController (T-4616b)', () => {
  it('збірка дає контролеру справжній BarberCancelSettlement', async () => {
    const { moduleRef } = await bootModule([]);

    expect(moduleRef.get(BarberCancelSettlement)).toBeInstanceOf(BarberCancelSettlement);
    expect(moduleRef.get(AdminBarberUnavailabilityController)).toBeInstanceOf(
      AdminBarberUnavailabilityController
    );
  });

  it('batch cancel повертає гроші за кожним скасованим візитом, не за id конфлікту', async () => {
    const { moduleRef, refund } = await bootModule([
      {
        conflictId: 'conflict-1',
        status: 'resolved',
        changed: true,
        cancelledBookingIds: ['booking-1', 'booking-2'],
      },
    ]);

    const controller = moduleRef.get(AdminBarberUnavailabilityController);
    const response = await controller.resolveBatch(
      { decisions: [{ conflictId: 'conflict-1', decision: 'cancel' }] },
      request
    );

    const settled = refund.mock.calls.map(([bookingId]) => bookingId);
    expect(settled).toEqual(['booking-1', 'booking-2']);
    expect(settled).not.toContain('conflict-1');
    expect(response.outcomes).toEqual([
      {
        conflictId: 'conflict-1',
        status: 'resolved',
        changed: true,
        cancelledBookingIds: ['booking-1', 'booking-2'],
      },
    ]);
  });

  it('batch reassign не чіпає гроші', async () => {
    const { moduleRef, refund } = await bootModule([
      { conflictId: 'conflict-1', status: 'resolved', changed: true },
    ]);

    await moduleRef
      .get(AdminBarberUnavailabilityController)
      .resolveBatch(
        {
          decisions: [
            {
              conflictId: 'conflict-1',
              decision: 'reassign',
              barberId: 'barber-2',
              date: '2026-11-27',
              start: '11:00',
              end: '12:00',
            },
          ],
        },
        request
      );

    expect(refund).not.toHaveBeenCalled();
  });
});
