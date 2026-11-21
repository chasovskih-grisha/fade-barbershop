// RefreshSession (T-014) — обмін валідного refresh на нову пару access+refresh.
// Ротація атомарна: CAS по (sessionId, поточний refresh-хеш) в одній транзакції.
// Reuse старого refresh (CAS-проліт після чужої ротації) — сигнал компрометації:
// сесія інвалідовується повністю (SessionRevoked), 401. TTL з env, рахує сервер.

import { SessionRefreshed, SessionRevoked } from '../domain/events';
import { generateToken, hashToken } from '../domain/otp-code';
import type { Session } from '../domain/session';
import { RefreshTokenInvalidError, RefreshTokenReuseError } from './identity-errors';
import { accessTtlSec, refreshTtlSec } from './token-ttl';
import type {
  RefreshSessionDeps,
  RefreshSessionInput,
  RefreshSessionResult,
} from './refresh-session.types';
export class RefreshSessionHandler {
  constructor(private readonly deps: RefreshSessionDeps) {}

  handle(input: RefreshSessionInput): Promise<RefreshSessionResult> {
    const { sessions, users, outbox, clock, uow } = this.deps;
    // handle завжди повертає Promise (контракти 4xx, не sync-throw).
    return uow.run(async (): Promise<RefreshSessionResult> => {
      const refresh = input.refreshToken.trim();
      if (refresh.length === 0) throw new RefreshTokenInvalidError();
      const refreshHash = hashToken(refresh);
      const session = await sessions.findByRefreshHash(refreshHash);
      if (!session) {
        // One-step reuse-детект: хеш збігається з попереднім (до останньої ротації)
        // → старий токен грають повторно → компрометація → повний logout.
        const stale = await sessions.findByPreviousRefreshHash?.(refreshHash);
        if (stale && stale.active) {
          await this.revokeAndPublish({ session: stale, now: clock.now() });
          throw new RefreshTokenReuseError();
        }
        throw new RefreshTokenInvalidError();
      }

      const now = clock.now();

      // Вже відкликана сесія (logout/зміна пароля/блокування) — просто 401.
      // Примітка: reuse-детект вище — через findByPreviousRefreshHash, бо
      // findByRefreshHash знаходить сесію саме за ПОТОЧНИМ хешем.
      if (!session.active) throw new RefreshTokenInvalidError();

      // Прострочений refresh — пара мертва, сесію не продовжуємо.
      if (
        session.refreshExpiresAt === null ||
        now.getTime() >= session.refreshExpiresAt.getTime()
      ) {
        await this.revokeAndPublish({ session, now });
        throw new RefreshTokenInvalidError();
      }

      // Ротація: CAS по (sessionId, поточний refresh-хеш, активна). Гонка двох
      // refresh: виграє один (count=1), другий отримує 0 → reuse-політика.
      const token = generateToken();
      const refreshToken = generateToken();
      const ttl = accessTtlSec();
      const rotated = await sessions.rotateTokens({
        sessionId: session.id,
        expectedRefreshHash: refreshHash,
        accessHash: hashToken(token),
        refreshTokenHash: hashToken(refreshToken),
        accessExpiresAt: new Date(now.getTime() + ttl * 1000),
        refreshExpiresAt: new Date(now.getTime() + refreshTtlSec() * 1000),
      });
      if (rotated !== 1) {
        await this.revokeAndPublish({ session, now });
        throw new RefreshTokenReuseError();
      }

      await outbox.append([
        new SessionRefreshed(
          { id: session.id, userId: session.userId, channel: session.channel },
          now
        ),
      ]);

      const user = await users.findById(session.userId);
      return {
        token,
        refreshToken,
        expiresInSec: ttl,
        userId: session.userId,
        phone: user?.phone?.value ?? '',
      };
    });
  }

  /** Повний logout скомпрометованої/простроченої сесії + подія в outbox. */
  private async revokeAndPublish(args: { session: Session; now: Date }): Promise<void> {
    const { sessions, outbox } = this.deps;
    if (args.session.revoke(args.now)) await sessions.save(args.session);
    await outbox.append([
      new SessionRevoked({ id: args.session.id, userId: args.session.userId }, args.now),
    ]);
  }
}
