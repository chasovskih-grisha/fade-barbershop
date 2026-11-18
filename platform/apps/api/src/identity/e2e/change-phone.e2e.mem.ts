// Mem-репозиторій сесій для e2e зміни номера (T-4620a): окремо від харнеса
// (max-lines). Verify ревокує «інші» сесії через findActiveByUser — тримаємо
// активні сесії клієнта, щоб перевірити живість поточної.
import { Session } from '../domain/session';

export class MemClientSessions {
  store = new Map<string, Session>();
  save = (session: Session) => void this.store.set(session.id, session);
  findByTokenHash = (hash: string) =>
    [...this.store.values()].find((s) => s.tokenHash === hash) ?? null;
  findByRefreshHash = () => Promise.resolve(null);
  findByPreviousRefreshHash = () => Promise.resolve(null);
  findActiveByUser = (userId: string) =>
    Promise.resolve([...this.store.values()].filter((s) => s.userId === userId && s.active));
  rotateTokens = () => Promise.resolve(0);
  revokeAllForUser = () => Promise.resolve(0);
}
