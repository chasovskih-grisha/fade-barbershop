// Session — активний вхід на каналі web | mobile | admin (ADR 0005/0017).
// Значення токенів не зберігаються — лише sha256 (tokenHash, refreshTokenHash).
// Cookie-адаптер web — T-011; access+refresh bearer для mobile — T-014.
// Форма даних і канали — у session.data.ts.

import type { SessionChannel, SessionData } from './session.data';

export { SESSION_CHANNELS } from './session.data';
export type { SessionChannel, SessionData } from './session.data';

export class Session {
  private constructor(private readonly data: SessionData) {}

  static issue(input: Omit<SessionData, 'revokedAt'>): Session {
    return new Session({ ...input, revokedAt: null });
  }

  static reconstitute(data: SessionData): Session {
    return new Session(data);
  }

  // prettier-ignore
  get id(): string { return this.data.id; }
  // prettier-ignore
  get userId(): string { return this.data.userId; }
  // prettier-ignore
  get channel(): SessionChannel { return this.data.channel; }

  /** T-4422: час входу (список пристроїв у кабінеті). */
  get createdAt(): Date {
    return this.data.createdAt;
  }

  get tokenHash(): string {
    return this.data.tokenHash;
  }

  get refreshTokenHash(): string | null {
    return this.data.refreshTokenHash;
  }

  get previousRefreshHash(): string | null {
    return this.data.previousRefreshHash;
  }

  get accessExpiresAt(): Date | null {
    return this.data.accessExpiresAt;
  }

  get refreshExpiresAt(): Date | null {
    return this.data.refreshExpiresAt;
  }

  get revokedAt(): Date | null {
    return this.data.revokedAt;
  }

  get active(): boolean {
    return this.data.revokedAt === null;
  }

  /** T-014: access-токен діє лише для mobile (web/admin живуть cookie-TTL). */
  accessValid(now: Date): boolean {
    return (
      this.active && this.accessExpiresAt !== null && this.accessExpiresAt.getTime() > now.getTime()
    );
  }

  // Інвалідує сесію скрізь (logout); ідемпотентно — без другої події.
  revoke(now: Date): boolean {
    if (!this.active) return false;
    this.data.revokedAt = now;
    return true;
  }

  /** T-014: атомарна ротація пари на тому ж sessionId. Кас дверей: ротація
   * лише з поточного refresh-хеша; після неї старі хеші не підходять — повтор
   * старого refresh розпізнається як reuse, не як ротація. */
  rotate(
    input: {
      accessHash: string;
      refreshTokenHash: string;
      accessExpiresAt: Date;
      refreshExpiresAt: Date;
    },
    presentedRefreshHash: string
  ): boolean {
    if (!this.active) return false;
    if (this.data.refreshTokenHash === null || this.data.refreshTokenHash !== presentedRefreshHash)
      return false;
    this.data.previousRefreshHash = this.data.refreshTokenHash;
    this.data.tokenHash = input.accessHash;
    this.data.refreshTokenHash = input.refreshTokenHash;
    this.data.accessExpiresAt = input.accessExpiresAt;
    this.data.refreshExpiresAt = input.refreshExpiresAt;
    return true;
  }
}
