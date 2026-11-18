// Воркер утримання (T-4490): добовий прохід (RETENTION_PURGE_INTERVAL_MS,
// дефолт 24 год, 0 — вимкнути). У тестах не стартує; ручний запуск — через
// PurgeExpiredData.execute(). Помилка проходу не вбиває процес: наступний тік
// незалежний, а частковий прогін лишає слід в аудиті.
import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { PurgeExpiredData } from './purge-expired-data';

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RetentionPurgeWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('RetentionPurge');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly purge: PurgeExpiredData) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.RETENTION_PURGE_DISABLED === 'true') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.RETENTION_PURGE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)): void {
    if (this.timer || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setTimeout(() => {
      void this.tick();
      this.timer = undefined;
      this.start(intervalMs);
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private async tick(): Promise<void> {
    try {
      const result = await this.purge.execute();
      this.logger.log(JSON.stringify(result));
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
