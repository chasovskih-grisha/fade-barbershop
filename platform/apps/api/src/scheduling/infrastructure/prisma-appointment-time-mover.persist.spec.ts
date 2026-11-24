// T-4737 guard: перенесення візиту (T-4533) рухає лише start/end/version —
// снепшот депозиту (PAY-ADM-09) лишається тим самим, а дедлайн скасування
// в кабінеті перераховується від нового початку, а не тягне стару дату.
import { persistMoveTime } from './prisma-appointment-time-mover.persist';
import { ListClientAppointments } from '../application/list-client-appointments';

const OLD_START = new Date('2026-10-10T09:00:00.000Z');
const OLD_END = new Date('2026-10-10T09:45:00.000Z');
const NEW_START = new Date('2026-10-12T13:00:00.000Z');
const NEW_END = new Date('2026-10-12T13:45:00.000Z');

// prettier-ignore
const row = {
  id: 'bk-1', appointmentId: 'apt-1', clientId: 'user-1', barberId: 'barber-1', locationId: 'loc-1',
  serviceId: 'svc-1', agreedPrice: 700, agreedDuration: 45, fulfillmentMode: null,
  status: 'booked', haircutReferenceId: null, appointmentComment: null, source: 'web',
  start: OLD_START, end: OLD_END, version: 3,
  // Снепшот на момент запису: 30% від 700 = 210, округлення 10, вікно 4 год.
  depositAmount: 210, depositPercent: 30, depositRounding: 10, cancellationWindowHours: 4,
};

/** In-memory транзакція: update справді змінює рядок, тож read-модель бачить новий час. */
function fakeTx(stored: typeof row) {
  const update = jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const { version, ...rest } = data;
    Object.assign(stored, rest);
    if (version && typeof version === 'object' && 'increment' in version) {
      stored.version += Number(version.increment);
    }
  });
  const outboxCreate = jest.fn().mockResolvedValue({});
  const tx = {
    booking: {
      // 1-й findFirst — знімок поточного рядка (як у Prisma: значення на момент
      // читання), 2-й — конфлікт барбера (немає).
      findFirst: jest
        .fn()
        .mockImplementationOnce(async () => ({ ...stored }))
        .mockResolvedValueOnce(null),
      findMany: jest.fn().mockResolvedValue([]),
      update,
    },
    chair: { count: jest.fn().mockResolvedValue(2) },
    outboxMessage: { create: outboxCreate },
  };
  return { tx: tx as never, txRaw: tx, update, outboxCreate };
}

function move(stored: typeof row) {
  const { tx, update, outboxCreate } = fakeTx(stored);
  return {
    update,
    outboxCreate,
    result: persistMoveTime(tx, {
      appointmentId: 'apt-1',
      newStart: NEW_START,
      newEnd: NEW_END,
      event: { type: 'appointment.rescheduled', payload: { appointmentId: 'apt-1' } },
    }),
  };
}

describe('перенесення візиту з депозитом', () => {
  it('оновлює лише час і версію — снепшот депозиту не переписується', async () => {
    const stored = { ...row };
    const { update, result } = move(stored);

    await result;

    // Guard: якщо колись почнуть писати весь рядок, депозит міг би обнулитися.
    expect(update).toHaveBeenCalledWith({
      where: { id: 'bk-1' },
      data: { start: NEW_START, end: NEW_END, version: { increment: 1 } },
    });
    expect(stored).toMatchObject({
      depositAmount: 210,
      depositPercent: 30,
      depositRounding: 10,
      cancellationWindowHours: 4,
    });
  });

  it('кабінет показує ту саму суму, а дедлайн зсувається на новий початок', async () => {
    const stored = { ...row };
    const { result } = move(stored);
    await result;

    const findMany = jest.fn().mockResolvedValue([stored]);
    const prisma = {
      booking: { findMany },
      depositHold: { findMany: jest.fn().mockResolvedValue([]) },
      service: { findMany: jest.fn().mockResolvedValue([{ id: 'svc-1', name: 'Стрижка' }]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'barber-1', name: 'Олег' }]) },
      location: { findMany: jest.fn().mockResolvedValue([{ id: 'loc-1', name: 'Поділ' }]) },
    };
    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.deposit).toEqual({
      amount: 210,
      // NEW_START (13:00Z) − 4 год; стара дата 05:00Z більше не показується.
      freeCancelUntil: '2026-10-12T09:00:00.000Z',
    });
    expect(view?.deposit?.freeCancelUntil).not.toBe('2026-10-10T05:00:00.000Z');
  });

  it('подія rescheduled несе старі часи, а не умови депозиту', async () => {
    const { result, outboxCreate } = move({ ...row });
    await result;

    const payload = outboxCreate.mock.calls[0][0].data.payload;
    expect(payload).toMatchObject({
      appointmentId: 'apt-1',
      oldStart: OLD_START.toISOString(),
      oldEnd: OLD_END.toISOString(),
    });
    expect(payload).not.toHaveProperty('depositAmount');
  });
});
