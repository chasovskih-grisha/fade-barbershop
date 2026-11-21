// AiGenerationWorker — таймер поверх циклу генерації (T-050). Провайдер не
// кликається з HTTP-запиту: запит лише створює pending-рядок, далі цей воркер.
// Опитування — свідома v1-простота, як у notifications/OutboxNotificationsDispatcher.
//
// Увімкнення: AI_WORKER_POLL_MS (дефолт 3000; 0 — вимкнути). У jest
// (NODE_ENV=test) автостарт не спрацьовує — тести керують tickOnce() вручну.

import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { AiGenerationCycle, type TickReport } from './ai-generation.cycle';

const POLL_DEFAULT_MS = 3_000;

@Injectable()
export class AiGenerationWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly cycle: AiGenerationCycle) {}

  tickOnce(): Promise<TickReport> {
    return this.cycle.run();
  }

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.AI_WORKER_POLL_MS ?? POLL_DEFAULT_MS)): void {
    if (this.timer || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setTimeout(() => {
      void this.cycle.run().catch((error: unknown) => {
        Logger.error(`[haircut-ai] worker tick failed: ${String(error)}`, 'AiGenerationWorker');
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
