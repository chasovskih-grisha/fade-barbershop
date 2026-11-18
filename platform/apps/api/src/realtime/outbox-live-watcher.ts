// Релей живого оновлення адмінки: опитує outbox на НОВІ події візитів і
// публікує сповіщення в AdminLiveFeed (далі — SSE). Лише читає: publishedAt,
// журнал і маршрутизацію споживачів не чіпає — це вотчина notifications
// (T-4608/T-080), тож контури не конкурують за один рядок.
//
// Watermark — час конструювання: події, що сталися після старту процесу,
// потрапляють у потік; історію до старту не переграємо (клієнт і так
// завантажує поточний стан при відкритті).
// Увімкнення: ADMIN_LIVE_POLL_MS (дефолт 3000; 0 — вимкнути). У jest — вимкнено.
import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AdminLiveFeed } from './admin-live-feed';
import { ADMIN_LIVE_TYPES } from './admin-live-types';

const POLL_DEFAULT_MS = 3_000;
const BATCH_SIZE = 50;

@Injectable()
export class OutboxLiveWatcher implements OnApplicationBootstrap, OnModuleDestroy {
  private timer?: ReturnType<typeof setTimeout> | undefined;
  private watermark: Date;

  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: AdminLiveFeed,
    now: () => Date = () => new Date()
  ) {
    this.watermark = now();
  }

  /** Один прохід: нові рядки після watermark → шина. */
  async pollOnce(): Promise<{ published: number }> {
    const since = this.watermark;
    const rows = await this.prisma.outboxMessage.findMany({
      where: { type: { in: [...ADMIN_LIVE_TYPES] }, createdAt: { gt: since } },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
      select: { type: true, aggregateId: true, createdAt: true },
    });
    const last = rows.at(-1);
    if (last) this.watermark = last.createdAt;
    for (const row of rows) this.feed.publish({ type: row.type, appointmentId: row.aggregateId });
    return { published: rows.length };
  }

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.ADMIN_LIVE_POLL_MS ?? POLL_DEFAULT_MS)): void {
    if (this.timer || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setTimeout(() => {
      void this.pollOnce().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(
          '[realtime] outbox live poll failed:',
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
