// Фейк LoginAudit (T-4411) — окремий файл за гейтом max-lines ports.fakes.
import type { LoginAudit } from '../domain/ports';

/** In-memory журнал входів (усі спроби зберігаються, list — без реверсу). */
export class FakeLoginAudit implements LoginAudit {
  rows: Array<{ userId: string; ts: Date; username: string; ok: boolean; actorId: string | null }> =
    [];
  record(
    userId: string,
    attempt: { ts: Date; username: string; ok: boolean; actorId: string | null }
  ): Promise<void> {
    this.rows.push({ userId, ...attempt });
    return Promise.resolve();
  }
  list(): Promise<Array<{ ts: Date; username: string; ok: boolean; actorId: string | null }>> {
    return Promise.resolve(
      this.rows.map(({ ts, username, ok, actorId }) => ({ ts, username, ok, actorId }))
    );
  }
}
