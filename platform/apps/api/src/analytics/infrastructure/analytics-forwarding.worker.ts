// Воркер серверної аналітики (T-4587): кожні ANALYTICS_FORWARD_POLL_MS
// (дефолт 30 с, 0 — вимкнути) переносить нові доменні події в чергу й
// надсилає батч. Без AMPLITUDE_API_KEY воркер не стартує — у деві/тестах
// немає кому платити за MTU, а тихі 401 у логах не потрібні.
// У jest (NODE_ENV=test) автостарт не спрацьовує, як в outbox notifications.
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ForwardAnalyticsEvents } from '../application/forward-analytics-events';

const DEFAULT_INTERVAL_MS = 30_000;

@Injectable()
export class AnalyticsForwardingWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('AnalyticsForwarding');
  private timer?: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly forward: ForwardAnalyticsEvents) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (!process.env.AMPLITUDE_API_KEY) {
      this.logger.log('AMPLITUDE_API_KEY is not set — server-side forwarding is off');
      return;
    }
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(intervalMs = Number(process.env.ANALYTICS_FORWARD_POLL_MS ?? DEFAULT_INTERVAL_MS)): void {
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
      const result = await this.forward.execute();
      if (result.sent || result.failed) this.logger.log(JSON.stringify(result));
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
