// Воркер архіву (T-4804): добовий прогін. ARCHIVE_INTERVAL_MS (дефолт 24 год,
// 0 — вимкнути), ARCHIVE_DISABLED=true — вимкнути повністю, ARCHIVE_AFTER_MONTHS
// (дефолт 24) — скільки місяців лишається гарячим. У тестах автостарт off.
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ArchiveBookings } from './archive-bookings.use-case';

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ArchiveWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('ArchiveBookings');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly archive: ArchiveBookings) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.ARCHIVE_DISABLED === 'true') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.ARCHIVE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)): void {
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
      const result = await this.archive.execute();
      this.logger.log(JSON.stringify(result));
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
