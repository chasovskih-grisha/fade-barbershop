// Специфікація outbox-секції /health (T-042c): лаг реле видно до T-4204;
// пороги → warning у секції (не 503), помилка проби — деградація до null.
import { OutboxHealthContributor, OUTBOX_LAG_WARN_PENDING, OUTBOX_LAG_WARN_MS } from './outbox-health.contributor';
import type { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';

const probeOf = (
  lag: { pending: number; oldestPendingMs: number | null },
  fail = false
): OutboxLagProbe =>
  ({
    lag: async () => {
      if (fail) throw new Error('pool exhausted');
      return lag;
    },
  }) as unknown as OutboxLagProbe;

describe('OutboxHealthContributor (/health секція outbox)', () => {
  it('без проби (мінімальна збірка) — секція null', async () => {
    const section = await new OutboxHealthContributor().snapshot(null);
    expect(section).toBeNull();
  });

  it('здоровий лаг: pending і oldest без warning', async () => {
    const section = await new OutboxHealthContributor().snapshot(
      probeOf({ pending: 2, oldestPendingMs: 500 })
    );
    expect(section).toMatchObject({ pending: 2, oldestPendingMs: 500, warning: null });
  });

  it(`порожня черга: oldestPendingMs = null, warning = null`, async () => {
    const section = await new OutboxHealthContributor().snapshot(
      probeOf({ pending: 0, oldestPendingMs: null })
    );
    expect(section).toMatchObject({ pending: 0, oldestPendingMs: null, warning: null });
  });

  it(`поріг кількості: pending > ${OUTBOX_LAG_WARN_PENDING} → warning`, async () => {
    const section = await new OutboxHealthContributor().snapshot(
      probeOf({ pending: OUTBOX_LAG_WARN_PENDING + 1, oldestPendingMs: 100 })
    );
    expect(section?.warning).toContain('pending');
  });

  it(`поріг віку: oldestPendingMs > ${OUTBOX_LAG_WARN_MS} → warning`, async () => {
    const section = await new OutboxHealthContributor().snapshot(
      probeOf({ pending: 1, oldestPendingMs: OUTBOX_LAG_WARN_MS + 1 })
    );
    expect(section?.warning).toContain('oldestPendingMs');
  });

  it('помилка проби не ламає /health — секція деградує до null', async () => {
    const section = await new OutboxHealthContributor().snapshot(probeOf(null as never, true));
    expect(section).toBeNull();
  });

  it('помилка-не-Error (рядок) — той самий шлях деградації', async () => {
    const boom = {
      lag: async () => {
        throw 'string failure';
      },
    } as unknown as OutboxLagProbe;
    const section = await new OutboxHealthContributor().snapshot(boom);
    expect(section).toBeNull();
  });
});
