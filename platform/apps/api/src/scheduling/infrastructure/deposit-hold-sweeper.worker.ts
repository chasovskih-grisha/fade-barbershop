// T-4619a: короткий in-process тік, що звільняє крісла з простроченим
// депозитним утриманням (ADR 0048 — не новий job engine). Інтервал
// DEPOSIT_HOLD_SWEEP_INTERVAL_MS (дефолт 60 с, 0 — вимкнути),
// DEPOSIT_HOLD_SWEEP_DISABLED=true — вимкнути повністю; у тестах не стартує.
// Повторний прохід нічого не змінює: `sweep()` ідемпотентний.
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { DepositHoldService } from '../application/deposit-hold.service';

const DEFAULT_INTERVAL_MS = 60 * 1000;

@Injectable()
export class DepositHoldSweeper implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('DepositHoldSweeper');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly holds: DepositHoldService) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.DEPOSIT_HOLD_SWEEP_DISABLED === 'true') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(
    intervalMs = Number(process.env.DEPOSIT_HOLD_SWEEP_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)
  ): void {
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
      const expired = await this.holds.sweep();
      if (expired.length) {
        this.logger.log(JSON.stringify({ expired: expired.map((hold) => hold.appointmentId) }));
      }
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
