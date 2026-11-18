// Легкий диспетчер outbox для контексту notifications (T-4608): тримає
// таймер опитування (start/stop/bootstrap), а сам прохід виконує
// pollOutboxOnce із outbox-poll.ts. Опитування — свідома v1-простота: спільний
// релей (T-042 слайс 1, LISTEN/NOTIFY vs polling — senior-рішення) прийде
// згодом; тоді handleOne() споживачів переїде в нього без змін.
//
// Увімкнення: NOTIFICATIONS_OUTBOX_POLL_MS (дефолт 15 000; 0 — вимкнути).
// У jest (NODE_ENV=test) автостарт не спрацьовує — тести керують вручну.

import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { pollOutboxOnce } from './outbox-poll';
import type { OutboxConsumers } from './outbox-routing';

const POLL_DEFAULT_MS = 15_000;

@Injectable()
export class OutboxNotificationsDispatcher implements OnApplicationBootstrap, OnModuleDestroy {
  // | undefined — explicit: exactOptionalPropertyTypes вимагає його для
  // присвоєння undefined (setTimeout у нових @types/node вже включає undefined).
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly consumers: OutboxConsumers
  ) {}

  /** Один прохід — делегує алгоритм у outbox-poll.ts. */
  pollOnce(): Promise<{ processed: number }> {
    return pollOutboxOnce({ prisma: this.prisma, consumers: this.consumers });
  }

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.NOTIFICATIONS_OUTBOX_POLL_MS ?? POLL_DEFAULT_MS)): void {
    if (this.timer || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setTimeout(() => {
      void this.pollOnce().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(
          '[notifications] outbox poll failed:',
          error instanceof Error ? error.message : error
        );
      });
      this.timer = undefined;
      this.start(intervalMs); // самоперезапуск: наступний тік незалежний від помилки
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
