// Фейк SessionRepository (T-014 refresh + T-4411 revokeAll) — окремо від
// інших портів (max-lines ports.fakes.ts).

import type { SessionRepository } from '../domain/ports';
import { Session } from '../domain/session';

export class FakeSessionRepository implements SessionRepository {
  private store = new Map<string, Session>();
  async save(session: Session): Promise<void> {
    this.store.set(session.id, session);
  }
  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    return [...this.store.values()].find((s) => s.tokenHash === tokenHash) ?? null;
  }
  /** T-014: пошук за поточним refresh-хешем (пам'ять тримає тільки поточний). */
  async findByRefreshHash(refreshHash: string): Promise<Session | null> {
    return [...this.store.values()].find((s) => s.refreshTokenHash === refreshHash) ?? null;
  }
  /** T-014: reuse-детект за one-step історією (previousRefreshHash). */
  async findByPreviousRefreshHash(previousHash: string): Promise<Session | null> {
    return [...this.store.values()].find((s) => s.previousRefreshHash === previousHash) ?? null;
  }
  /** T-4422: активні сесії користувача (пристрої, «вийти скрізь»). */
  async findActiveByUser(userId: string): Promise<Session[]> {
    return [...this.store.values()].filter((s) => s.userId === userId && s.active);
  }
  /** T-014: CAS-ротація — лише з поточного refresh-хеша активної сесії. */
  async rotateTokens(input: {
    sessionId: string;
    expectedRefreshHash: string;
    accessHash: string;
    refreshTokenHash: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }): Promise<number> {
    const session = this.store.get(input.sessionId);
    if (!session) return 0;
    const current = this.store.get(input.sessionId);
    if (!current || current.refreshTokenHash !== input.expectedRefreshHash || !current.active)
      return 0;
    if (
      current.rotate(
        {
          accessHash: input.accessHash,
          refreshTokenHash: input.refreshTokenHash,
          accessExpiresAt: input.accessExpiresAt,
          refreshExpiresAt: input.refreshExpiresAt,
        },
        input.expectedRefreshHash
      )
    )
      return 1;
    return 0;
  }

  /** Пряма мутація для тестів reuse: оновлює рядок сесії в пам'яті. */
  put(session: Session): void {
    this.store.set(session.id, session);
  }
  get all(): Session[] {
    return [...this.store.values()];
  }
  /** T-4411: інвалідація всіх активних сесій користувача. */
  async revokeAllForUser(userId: string, now: Date): Promise<number> {
    let count = 0;
    for (const session of this.store.values())
      if (session.userId === userId && session.revoke(now)) count += 1;
    return count;
  }
}
