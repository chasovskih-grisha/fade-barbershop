// T-4616b: партія повертає гроші за скасованими візитами (booking ids), а не за
// id конфлікту — інакше settlement шукав би візит за чужим ключем.
import type { Request } from 'express';
import { AdminBarberUnavailabilityController } from './admin-barber-unavailability.controller';
import type { ResolveShiftConflict } from '../application/resolve-shift-conflict.use-case';
import type { BarberCancelSettlementResult } from '../../payment/application/barber-cancel-settlement.use-case';

const request = { adminUserId: 'founder-1' } as unknown as Request;

function controllerWithBatch(outcomes: Awaited<ReturnType<ResolveShiftConflict['executeMany']>>) {
  const settle = jest.fn(
    async (input: { appointmentId: string }): Promise<BarberCancelSettlementResult> => ({
      outcome: 'refund_initiated',
      holdReleased: true,
      amount: 210,
      refundId: `barber_unavailable_${input.appointmentId}`,
      refundStatus: 'completed',
    })
  );
  const controller = new AdminBarberUnavailabilityController(
    { execute: jest.fn() } as never,
    { execute: jest.fn() } as never,
    { execute: jest.fn(), executeMany: jest.fn(async () => outcomes) } as never,
    { settle } as never
  );
  return { controller, settle };
}

describe('AdminBarberUnavailabilityController: batch resolve (T-4616b)', () => {
  it('batch cancel проводить по одному settlement на скасований візит', async () => {
    const { controller, settle } = controllerWithBatch([
      {
        conflictId: 'conflict-1',
        status: 'resolved',
        changed: true,
        cancelledBookingIds: ['booking-1', 'booking-2'],
      },
    ]);

    const response = await controller.resolveBatch(
      { decisions: [{ conflictId: 'conflict-1', decision: 'cancel' }] },
      request
    );

    expect(settle.mock.calls.map(([input]) => input.appointmentId)).toEqual([
      'booking-1',
      'booking-2',
    ]);
    expect(settle).not.toHaveBeenCalledWith({ appointmentId: 'conflict-1' });
    expect(response.outcomes).toEqual([
      {
        conflictId: 'conflict-1',
        status: 'resolved',
        changed: true,
        cancelledBookingIds: ['booking-1', 'booking-2'],
      },
    ]);
  });

  // Одна нога впала — решта все одно проводиться, а відповідь каже, що саме
  // не повернулось, замість 500 на весь пакет (T-4616b).
  it('збій settlement по одному візиту не валить партію', async () => {
    const { controller, settle } = controllerWithBatch([
      {
        conflictId: 'conflict-1',
        status: 'resolved',
        changed: true,
        cancelledBookingIds: ['booking-1', 'booking-2'],
      },
    ]);
    settle.mockRejectedValueOnce(new Error('payment ledger down'));

    const response = await controller.resolveBatch(
      { decisions: [{ conflictId: 'conflict-1', decision: 'cancel' }] },
      request
    );

    expect(settle.mock.calls.map(([input]) => input.appointmentId)).toEqual([
      'booking-1',
      'booking-2',
    ]);
    expect(response.outcomes[0]?.status).toBe('resolved');
  });

  it('batch reassign не чіпає гроші', async () => {
    const { controller, settle } = controllerWithBatch([
      { conflictId: 'conflict-1', status: 'resolved', changed: true },
    ]);

    await controller.resolveBatch(
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

    expect(settle).not.toHaveBeenCalled();
  });
});
