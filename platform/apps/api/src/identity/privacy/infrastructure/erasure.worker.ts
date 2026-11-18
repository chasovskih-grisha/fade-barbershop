// Воркер стирання (T-4805): інтервал 30 с, бо @nestjs/schedule у проєкті
// немає (та сама механіка, що в outbox-релеї). Помилки не валять процес:
// заявка лишається pending із backoff. Вимкнути — ERASURE_WORKER_DISABLED=true.
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { RunErasure } from '../application/run-erasure';

const INTERVAL_MS = 30_000;

@Injectable()
export class ErasureWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('ErasureWorker');
  private timer?: NodeJS.Timeout;

  constructor(private readonly run: RunErasure) {}

  onModuleInit(): void {
    if (process.env.ERASURE_WORKER_DISABLED === 'true') return;
    this.timer = setInterval(() => {
      void this.run.execute().catch((error: unknown) => {
        this.logger.error(error instanceof Error ? error.message : String(error));
      });
    }, INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
