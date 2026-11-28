// T-4616b: in-process тік, що доводить застряглі повернення до кінця
// (ADR 0048 — не новий job engine, той самий підхід, що й у deposit-hold nudge).
//
// REFUND_RECONCILE_INTERVAL_MS (дефолт 5 хв, 0 — вимкнути),
// REFUND_RECONCILE_DISABLED=true — вимкнути повністю; у тестах не стартує.
// Тик ідемпотентний: повторний прохід не повертає ті самі гроші вдруге.
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ReconcileStuckRefunds } from '../application/reconcile-stuck-refunds.use-case';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class RefundReconciliationWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('RefundReconciliation');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly reconcile: ReconcileStuckRefunds) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.REFUND_RECONCILE_DISABLED === 'true') return;
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(
    intervalMs = Number(process.env.REFUND_RECONCILE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)
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
      const outcomes = await this.reconcile.run();
      if (outcomes.length) this.logger.log(JSON.stringify({ outcomes }));
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
