// DI-стенд контролера пристроїв (T-4422) для специфікації: фейкові репозиторії,
// use cases і контролер з допуском лімітера. Окремо від спеки — гейт max-lines.
import { ClientSessionsController } from './client-sessions.controller';
import { PushTokensController } from './push-tokens.controller';
import { SetClientEmailHandler } from '../application/set-client-email';
import { RevokeAllSessionsHandler } from '../application/revoke-all-sessions';
import { ListClientSessionsHandler } from '../application/list-client-sessions';
import { RegisterPushTokenHandler } from '../application/register-push-token';
import { RevokePushTokenHandler } from '../application/revoke-push-token';
import { FakePushTokenRepository } from '../application/push-token.fakes';
import { FakeClock, FakeOutbox, FakeSessionRepository, FakeUserRepository, UuidIds, T0, passthroughUow, seedSession, seedUser } from '../application/client-sessions.fakes';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';
import { SESSION_MOBILE, SESSION_WEB } from '../application/test-ids';

export {
  FakeOutbox,
  FakeSessionRepository,
  seedSession,
  seedUser,
} from '../application/client-sessions.fakes';

/** Контролер на фейках + токен web-сесії + mobile-сесія для перевірок. */
export function makeController() {
  const sessions = new FakeSessionRepository();
  const users = new FakeUserRepository();
  const outbox = new FakeOutbox();
  const tokens = new FakePushTokenRepository();
  const clock = new FakeClock(T0);
  seedUser(users);
  const webToken = seedSession(sessions, { id: SESSION_WEB, channel: 'web' }).token;
  seedSession(sessions, {
    id: SESSION_MOBILE,
    channel: 'mobile',
    accessExpiresAt: new Date(Date.now() + 60_000),
  });
  const limiter = { tryAcquire: jest.fn().mockResolvedValue({ allowed: true }) };
  const useCases = {
    list: new ListClientSessionsHandler(sessions),
    revokeAll: new RevokeAllSessionsHandler({
      sessions,
      outbox,
      clock: new FakeClock(T0),
      uow: passthroughUow,
    }),
    setEmail: new SetClientEmailHandler({
      users,
      outbox,
      clock: new FakeClock(T0),
      uow: passthroughUow,
    }),
    registerPush: new RegisterPushTokenHandler({
      tokens,
      ids: new UuidIds(),
      clock,
      uow: passthroughUow,
    }),
    revokePush: new RevokePushTokenHandler({ tokens, clock, uow: passthroughUow }),
  };
  const controller = new ClientSessionsController(
    useCases,
    limiter as unknown as RateLimiter,
    new RateLimitMetrics()
  );
  const pushController = new PushTokensController(useCases);
  return { sessions, outbox, tokens, limiter, controller, pushController, webToken };
}
