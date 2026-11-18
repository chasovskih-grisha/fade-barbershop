// OutboxHealthContributor — outbox-секція /health (T-042c → T-4204):
// лаг реле подій видно до повного observability-стеку. Пороги свідомо
// консервативні: попередження в секції (не 503 — /health лишається пробою
// живості, деградація реле не виглядає падінням процесу, дух GeocoderHealth).

import { Injectable, Logger } from '@nestjs/common';
import type { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';

/** Пороги лагу: попередження — якщо реле відстає. */
export const OUTBOX_LAG_WARN_PENDING = 50;
export const OUTBOX_LAG_WARN_MS = 60_000;

/** Outbox-секція /health: лаг реле подій або null (проба недоступна). */
export interface OutboxHealthSection {
  pending: number;
  oldestPendingMs: number | null;
  /** Позаштатний лаг — для алертів на біді (T-4204 підключить Alertmanager). */
  warning: string | null;
}

@Injectable()
export class OutboxHealthContributor {
  private readonly logger = new Logger(OutboxHealthContributor.name);

  /** Помилка проби не ламає /health — секція деградує до null (дух ADR 0050). */
  async snapshot(probe: OutboxLagProbe | null): Promise<OutboxHealthSection | null> {
    if (!probe) return null;
    try {
      const { pending, oldestPendingMs } = await probe.lag();
      // prettier-ignore
      const warning =
        pending > OUTBOX_LAG_WARN_PENDING ? `pending > ${OUTBOX_LAG_WARN_PENDING}`
        : oldestPendingMs !== null && oldestPendingMs > OUTBOX_LAG_WARN_MS ? `oldestPendingMs > ${OUTBOX_LAG_WARN_MS}`
        : null;
      return { pending, oldestPendingMs, warning };
    } catch (error) {
      this.logger.warn(
        `outbox health probe failed: ${error instanceof Error ? error.message : 'unknown'}`
      );
      return null;
    }
  }
}
