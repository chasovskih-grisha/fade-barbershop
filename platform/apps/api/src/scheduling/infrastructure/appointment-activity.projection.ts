// Обробник-еталон outbox-подій (T-042c, патерн ADR 0009): журнал оброблених
// подій + проекція AppointmentActivity. Повторна доставка (at-least-once)
// не дублює ефектів: id події перевіряється/пишеться в тій самій транзакції.
// Патерн копіюють T-140 (лояльність), T-150 (відгуки), T-170 (waitlist),
// T-110 (аналітика) — правило: обробка і журнал в одній транзакції.
// Моніторинг лага — в сусідньому outbox-lag.probe.ts (реекспорт нижче тримає
// стабільний імпорт для health/metrics).

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { withSpan, extractOutboxTrace, TRACING } from '../../shared/tracing/tracing';

export { OutboxLagProbe } from './outbox-lag.probe';

export interface OutboxMessageLike {
  id: string;
  type: string;
  aggregateId: string;
  payload: unknown;
}

export interface HandleOutcome {
  handled: boolean;
  reason: 'applied' | 'duplicate' | 'ignored';
}

@Injectable()
export class AppointmentActivityProjection {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Обробити одну подію outbox. Ідемпотентно: duplicate → жодних ефектів.
   * Викликається релеєм всередині $transaction (параметр tx обов'язковий):
   * падіння apply відкочує журнал разом з ефектом (at-least-once, не at-most).
   * Спан обробки (T-4204): релей — джерело спанів, обробка продовжує трейс
   * продюсера (спільний патерн з диспетчером notifications).
   */
  async handleOne(
    message: OutboxMessageLike,
    tx: Prisma.TransactionClient
  ): Promise<HandleOutcome> {
    const parent = extractOutboxTrace(message); // W3C-каріювання продюсера → remote parent
    return withSpan({
      name: TRACING.OUTBOX_HANDLE,
      options: {
        attributes: { [TRACING.EVENT_TYPE]: message.type, [TRACING.EVENT_ID]: message.id },
      },
      work: async (span) => {
        const outcome = await this.process(message, tx);
        span.setAttribute(TRACING.HANDLE_REASON, outcome.reason);
        return outcome;
      },
      ...(parent ? { parent } : {}),
    });
  }

  private async process(
    message: OutboxMessageLike,
    tx: Prisma.TransactionClient
  ): Promise<HandleOutcome> {
    if (!isAppointmentEvent(message.type)) return { handled: false, reason: 'ignored' };
    // Реальний Prisma upsert повертає наявний рядок і для дубля теж, тому
    // duplicate виявляється findUnique до claim (перевірка+запис в одній
    // транзакції релея). Гонка двох релеїв на ту саму подію рідкісна й безпечна:
    // проекція :current сама ідемпотентна.
    const existing = await tx.appointmentActivity.findUnique({
      where: { eventId: message.id },
      select: { eventId: true },
    });
    if (existing) return { handled: false, reason: 'duplicate' };
    await tx.appointmentActivity.upsert({
      where: { eventId: message.id },
      create: { id: uuidv7(), eventId: message.id, type: message.type, processedAt: new Date() },
      update: {},
    });
    await this.apply(tx, message);
    return { handled: true, reason: 'applied' };
  }

  private async apply(tx: Prisma.TransactionClient, message: OutboxMessageLike): Promise<void> {
    const payload = message.payload as { appointmentId: string; barberId?: string };
    const note = `${payload.appointmentId}:${payload.barberId ?? ''}`;
    await tx.appointmentActivity.upsert({
      where: { eventId: `${message.aggregateId}:current` },
      create: {
        id: uuidv7(),
        eventId: `${message.aggregateId}:current`,
        type: message.type,
        processedAt: new Date(),
        note,
      },
      update: { type: message.type, processedAt: new Date(), note },
    });
  }
}

function isAppointmentEvent(type: string): boolean {
  return type.startsWith('scheduling.appointment.');
}
