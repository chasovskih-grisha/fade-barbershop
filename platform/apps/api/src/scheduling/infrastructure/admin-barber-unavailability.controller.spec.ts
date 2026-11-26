// T-4616a/T-4616b: рішення «скасувати» доходить до грошей, «перенести» — ні.
import type { Request } from 'express';
import { AdminBarberUnavailabilityController } from './admin-barber-unavailability.controller';
import type { ResolveShiftConflictResult } from '../application/resolve-shift-conflict.use-case';
import type { BarberCancelSettlementResult } from '../../payment/application/barber-cancel-settlement.use-case';

const request = { adminUserId: 'founder-1' } as unknown as Request;

function resolveResult(over: Partial<ResolveShiftConflictResult>): ResolveShiftConflictResult {
  return {
    conflict: { id: 'conflict-1', bookingId: 'booking-1' } as never,
    changed: true,
    ...over,
  };
}

function controllerWith(result: ResolveShiftConflictResult) {
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
    { execute: jest.fn(async () => result), executeMany: jest.fn() } as never,
    { settle } as never
  );
  return { controller, settle };
}

describe('AdminBarberUnavailabilityController (T-4616a)', () => {
  it('після скасування повертає гроші за кожним скасованим візитом', async () => {
    const { controller, settle } = controllerWith(
      resolveResult({ cancelledBookingIds: ['booking-1', 'booking-2'] })
    );

    const response = await controller.resolveOne('conflict-1', { decision: 'cancel' }, request);

    expect(settle).toHaveBeenCalledTimes(2);
    expect(settle).toHaveBeenCalledWith({ appointmentId: 'booking-1' });
    expect(response.settlements?.map((entry) => entry.outcome)).toEqual([
      'refund_initiated',
      'refund_initiated',
    ]);
  });

  it('перенесення не чіпає гроші', async () => {
    const { controller, settle } = controllerWith(resolveResult({ cancelledBookingIds: [] }));

    const response = await controller.resolveOne(
      'conflict-1',
      {
        decision: 'reassign',
        barberId: 'barber-2',
        date: '2026-11-27',
        start: '11:00',
        end: '12:00',
      },
      request
    );

    expect(settle).not.toHaveBeenCalled();
    expect(response.settlements).toBeUndefined();
  });

  it('повторне рішення по закритому конфлікту не повертає гроші вдруге', async () => {
    const { controller, settle } = controllerWith(
      resolveResult({ changed: false, cancelledBookingIds: ['booking-1'] })
    );

    await controller.resolveOne('conflict-1', { decision: 'cancel' }, request);

    expect(settle).not.toHaveBeenCalled();
  });
});
