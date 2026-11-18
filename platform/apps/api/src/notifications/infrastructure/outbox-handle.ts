// Обробка одного рядка outbox контекстом notifications (T-080): усі споживачі
// типу події → журнал кожного. Рядок закривається publishedAt лише коли всі
// споживачі довели справу (handled/duplicate); 'ignored' лишає рядок pending.
// Падіння send прокидається — прохід переривається, подія лишається pending
// (ретрай наступним тіком), тож жоден споживач не бачить «напівоброблене».
import type { OutboxMessage } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { extractOutboxTrace, withSpan, TRACING } from '../../shared/tracing/tracing';
import type { NotificationEvent } from '../application/send-booking-confirmation';
import { consumersFor, type OutboxConsumers, type RoutedConsumer } from './outbox-routing';

/** Повертає кількість оброблених споживачів (0 — рядок лишається pending). */
export async function handleOutboxMessage(
  prisma: PrismaService,
  consumers: OutboxConsumers,
  message: OutboxMessage
): Promise<number> {
  const routed = consumersFor(message.type, consumers);
  if (routed.length === 0) return 0;
  const event: NotificationEvent = {
    id: message.id,
    type: message.type,
    aggregateId: message.aggregateId,
    payload: message.payload,
  };
  let processed = 0;
  for (const consumer of routed) {
    const outcome = await runConsumer(consumer, message, event);
    if (outcome.handled || outcome.reason === 'duplicate') {
      processed += 1;
      continue;
    }
    return processed;
  }
  await prisma.outboxMessage.update({
    where: { id: message.id },
    data: { publishedAt: new Date() },
  });
  return processed;
}

/** Релей — джерело спанів: обробка події продовжує трейс продюсера
 *  (W3C-карірування з payload → remote parent; старі події без нього —
 *  чесно кореневі спани). */
async function runConsumer(
  consumer: RoutedConsumer,
  message: OutboxMessage,
  event: NotificationEvent
) {
  const parent = extractOutboxTrace(message); // Context | undefined
  return withSpan({
    name: TRACING.OUTBOX_HANDLE,
    options: {
      attributes: { [TRACING.EVENT_TYPE]: message.type, [TRACING.EVENT_ID]: message.id },
    },
    work: async (span) => {
      const result = await consumer.handleOne(event);
      span.setAttribute(TRACING.HANDLE_REASON, result.reason);
      return result;
    },
    ...(parent ? { parent } : {}),
  });
}
