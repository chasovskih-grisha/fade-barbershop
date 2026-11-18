// Один прохід outbox-опитування notifications (T-4608, розширено T-080):
// своя підмножина типів подій → споживачі → журнал/маркер. Життєвий цикл
// (таймер, bootstrap) — у outbox-dispatcher.ts; обробка одного рядка —
// в outbox-handle.ts.
//
// publishedAt тут — «подію оброблено споживачами notifications» для свого
// підмножини типів; дублювання безпечне: ідемпотентність тримає журнал
// NotificationRecord (eventId унікальний), не маркер publishedAt.
// availableAt (T-080) — відкладена доставка: рядок нагадування лишається
// невидимим релею до часу спрацювання (переживає рестарт процесу).
import { PrismaService } from '../../shared/prisma/prisma.service';
import { withSpan } from '../../shared/tracing/tracing';
import { POLL_TYPES, type OutboxConsumers } from './outbox-routing';
import { handleOutboxMessage } from './outbox-handle';

const BATCH_SIZE = 25;

export interface OutboxPollDeps {
  prisma: PrismaService;
  consumers: OutboxConsumers;
}

/** Один прохід: своя підмножина подій → споживачі → журнал/маркер. */
export async function pollOutboxOnce(deps: OutboxPollDeps): Promise<{ processed: number }> {
  const { prisma, consumers } = deps;
  return withSpan({
    name: 'outbox.poll',
    work: async (poll) => {
      const messages = await prisma.outboxMessage.findMany({
        where: {
          type: { in: [...POLL_TYPES] },
          publishedAt: null,
          OR: [{ availableAt: null }, { availableAt: { lte: new Date() } }],
        },
        // Відкладені — за часом спрацювання, решта — за часом створення.
        orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }],
        take: BATCH_SIZE,
      });
      let processed = 0;
      for (const message of messages) {
        processed += await handleOutboxMessage(prisma, consumers, message);
      }
      poll.setAttribute('fade.processed', processed);
      return { processed };
    },
  });
}
