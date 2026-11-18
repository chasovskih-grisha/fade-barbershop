// Специфікація обробника-еталона (T-042c): повторна доставка не дублює ефектів
// (журнал у тій самій транзакції), чужі події ігноруються, збій apply відкочує.

import type { OutboxMessageLike } from './appointment-activity.projection';

export function journal(events: string[]) {
  // Моделює реальний Prisma: findUnique (duplicate-перевірка), upsert = claim.
  const known = new Set(events);
  return {
    appointmentActivity: {
      // prettier-ignore
      findUnique: jest.fn(async ({ where }: { where: { eventId: string } }) => (known.has(where.eventId) ? { eventId: where.eventId } : null)),
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { eventId: string };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => (known.has(where.eventId) ? update : (known.add(where.eventId), create))
      ),
    },
  };
}

export function prismaWith(journalTx: object, failed = false) {
  let calls = 0;
  return {
    $transaction: jest.fn(async (work: (tx: object) => Promise<unknown>) => {
      calls += 1;
      if (failed && calls === 1) throw new Error('simulated delivery failure');
      return work(journalTx);
    }),
    // prettier-ignore
    outboxMessage: { findMany: jest.fn(async () => [{ createdAt: new Date(Date.now() - 5000) }, { createdAt: new Date() }]) },
  };
}

// prettier-ignore
export const bookedEvent: OutboxMessageLike = { id: 'evt-1', type: 'scheduling.appointment.booked', aggregateId: 'apt-1', payload: { appointmentId: 'apt-1', barberId: 'b1' } };
