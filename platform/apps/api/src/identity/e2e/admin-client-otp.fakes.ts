// Mem-провайдери e2e identity (T-4409/T-4411; окремий файл — max-lines гейт).
import { User } from '../domain/user';
import { Session } from '../domain/session';
import { OtpChallenge } from '../domain/otp-challenge';
import type { LoginAudit, OtpChallengeRepository, OtpSender } from '../domain/ports';

export class MemUsers {
  store = new Map<string, User>();
  findById = (id: string) => this.store.get(id) ?? null;
  findByPhone = (phone: string) =>
    [...this.store.values()].find((u) => u.phone.value === phone) ?? null;
  findByUsername = (username: string) =>
    [...this.store.values()].find((u) => u.username === username) ?? null;
  save = (user: User) => void this.store.set(user.id, user);
}

export class MemSessions {
  store = new Map<string, Session>();
  save = (session: Session) => void this.store.set(session.id, session);
  findByTokenHash = (tokenHash: string) =>
    [...this.store.values()].find((s) => s.tokenHash === tokenHash) ?? null;
  findByRefreshHash = (refreshHash: string) =>
    [...this.store.values()].find((s) => s.refreshTokenHash === refreshHash) ?? null;
  findByPreviousRefreshHash = (previousHash: string) =>
    [...this.store.values()].find((s) => s.previousRefreshHash === previousHash) ?? null;
  rotateTokens = (input: {
    sessionId: string;
    expectedRefreshHash: string;
    accessHash: string;
    refreshTokenHash: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }) => {
    const s = this.store.get(input.sessionId);
    if (!s || s.refreshTokenHash !== input.expectedRefreshHash || !s.active)
      return Promise.resolve(0);
    return Promise.resolve(
      s.rotate(
        {
          accessHash: input.accessHash,
          refreshTokenHash: input.refreshTokenHash,
          accessExpiresAt: input.accessExpiresAt,
          refreshExpiresAt: input.refreshExpiresAt,
        },
        input.expectedRefreshHash
      )
        ? 1
        : 0
    );
  };
  /** T-4411: інвалідація всіх активних сесій користувача. */
  revokeAllForUser = (userId: string, now: Date) => {
    let count = 0;
    for (const s of this.store.values()) if (s.userId === userId && s.revoke(now)) count += 1;
    return Promise.resolve(count);
  };
}

/** T-4411: in-memory журнал входів. */
export class MemLoginAudit implements LoginAudit {
  rows: Array<{ userId: string; ts: Date; username: string; ok: boolean; actorId: string | null }> =
    [];
  record(
    userId: string,
    attempt: { ts: Date; username: string; ok: boolean; actorId: string | null }
  ) {
    this.rows.push({ userId, ...attempt });
    return Promise.resolve();
  }
  list(userId: string, limit: number) {
    return Promise.resolve(
      this.rows
        .filter((r) => r.userId === userId)
        .slice(-limit)
        .reverse()
        .map(({ ts, username, ok, actorId }) => ({ ts, username, ok, actorId }))
    );
  }
}

export class MemChallenges implements OtpChallengeRepository {
  store = new Map<string, OtpChallenge>();
  async findLastByPhone(phone: string) {
    return (
      [...this.store.values()]
        .filter((c) => c.phone === phone)
        .sort((a, b) => +b.createdAt - +a.createdAt)[0] ?? null
    );
  }
  async save(c: OtpChallenge) {
    this.store.set(c.id, c);
  }
}

export class CapturingSender implements OtpSender {
  sent: { phone: string; digits: string; purpose?: string | undefined }[] = [];
  async send(phone: string, digits: string, purpose?: 'login' | 'booking') {
    this.sent.push({ phone, digits, purpose });
  }
}
