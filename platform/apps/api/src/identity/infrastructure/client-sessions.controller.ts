// BFF-ендпоінти пристроїв і сесій клієнта (T-4422): список активних сесій
// («пристрої»), «вийти скрізь», email для сповіщень безпеки. Поточний
// пристрій визначає сервер за токеном запиту (гвард кладе clientSession).
// Rate limit на revoke-all (T-4410) — спільний 429 через acquireOrThrow429.

import { Body, Controller, Get, Inject, Post, Put, Req, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type {
  ListClientSessionsResult,
  RevokeAllSessionsResult,
  SetClientEmailInput,
} from '@fade/contracts';
import { ClientSessionGuard, clientSessionOf, type ClientSession } from './client-session.guard';
import { ListClientSessionsHandler } from '../application/list-client-sessions';
import { RevokeAllSessionsHandler } from '../application/revoke-all-sessions';
import { SetClientEmailHandler, type SetClientEmailResult } from '../application/set-client-email';
import { RegisterPushTokenHandler } from '../application/register-push-token';
import { RevokePushTokenHandler } from '../application/revoke-push-token';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { OTP_VERIFY_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

function clientKey(req: Request): string {
  return String(req.headers['x-forwarded-for'] ?? req.ip ?? 'unknown');
}

/** Сесію кладе ClientSessionGuard; без неї (гвард обійдений) — 401. */
export function requireClientSession(req: Request): ClientSession {
  const session = clientSessionOf(req);
  if (!session) throw new UnauthorizedException('Client session required');
  return session;
}

/** Бандл use cases (гейт max-params): фабрика дістає позиційно. */
export interface ClientSessionUseCases {
  list: ListClientSessionsHandler;
  revokeAll: RevokeAllSessionsHandler;
  setEmail: SetClientEmailHandler;
  registerPush: RegisterPushTokenHandler;
  revokePush: RevokePushTokenHandler;
}

@Controller('identity/client')
@UseFilters(IdentityExceptionFilter)
@UseGuards(ClientSessionGuard)
export class ClientSessionsController {
  constructor(
    @Inject('CLIENT_SESSION_USE_CASES') private readonly useCases: ClientSessionUseCases,
    @Inject(OTP_VERIFY_LIMITER) private readonly limiter: RateLimiter,
    private readonly violations: RateLimitMetrics
  ) {}

  /** Активні сесії клієнта (web/mobile), поточна — current: true. */
  @Get('sessions')
  async sessions(@Req() req: Request): Promise<ListClientSessionsResult> {
    const session = requireClientSession(req);
    return this.useCases.list.handle({
      userId: session.userId,
      currentSessionId: session.sessionId,
    });
  }

  /** «Вийти скрізь»: ревок інших активних сесій, поточна лишається живою. */
  @Post('sessions/revoke-all')
  async revokeAllSessions(@Req() req: Request): Promise<RevokeAllSessionsResult> {
    await acquireOrThrow429(this.limiter, 'client-revoke-all:' + clientKey(req), this.violations);
    const session = requireClientSession(req);
    try {
      return await this.useCases.revokeAll.handle({
        userId: session.userId,
        currentSessionId: session.sessionId,
      });
    } catch (error) {
      throw toHttp(error);
    }
  }

  /** Email для сповіщень безпеки; '' — прибрати (вимкнути сповіщення). */
  @Put('email')
  async updateEmail(
    @Req() req: Request,
    @Body() body: SetClientEmailInput
  ): Promise<SetClientEmailResult> {
    const session = requireClientSession(req);
    try {
      return await this.useCases.setEmail.handle({
        userId: session.userId,
        email: String(body?.email ?? ''),
      });
    } catch (error) {
      throw toHttp(error);
    }
  }
}
