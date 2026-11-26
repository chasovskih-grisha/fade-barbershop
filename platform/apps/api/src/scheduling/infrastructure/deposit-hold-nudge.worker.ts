// T-4619: in-process тік, що нагадує клієнту про дедлайн депозиту за кілька
// хвилин до звільнення крісла (ADR 0048 — не новий job engine).
//
// DEPOSIT_HOLD_NUDGE_INTERVAL_MS (дефолт 60 с, 0 — вимкнути),
// DEPOSIT_HOLD_NUDGE_DISABLED=true — вимкнути повністю; у тестах не стартує.
// Повторний прохід нічого не дублює: право на нагадування тримає outbox.
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { NudgeExpiringHolds } from '../application/nudge-expiring-holds';

const DEFAULT_INTERVAL_MS = 60 * 1000;

@Injectable()
export class DepositHoldNudgeWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('DepositHoldNudge');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly nudge: NudgeExpiringHolds) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.DEPOSIT_HOLD_NUDGE_DISABLED === 'true') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(
    intervalMs = Number(process.env.DEPOSIT_HOLD_NUDGE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)
  ): void {
    if (this.timer || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setTimeout(() => {
      void this.tick();
      this.timer = undefined;
      this.start(intervalMs);
    }, intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private async tick(): Promise<void> {
    try {
      const noticed = await this.nudge.run();
      if (noticed.length) this.logger.log(JSON.stringify({ noticed }));
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
