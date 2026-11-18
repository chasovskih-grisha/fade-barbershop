// BFF-ендпоінти зміни номера клієнта (T-4620a): запит коду на новий номер і
// верифікація. Обидва під ClientSessionGuard — зміна можлива лише з активної
// сесії; поточний пристрій (sessionId) передаємо у verify, щоб ревокувати
// ЛИШЕ інші сесії. Rate limit (T-4410) — спільний 429 через acquireOrThrow429.

import { Body, Controller, Inject, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type {
  RequestPhoneChangeOtpInput,
  VerifyPhoneChangeInput,
  VerifyPhoneChangeResult,
} from '@fade/contracts';
import { ClientSessionGuard } from './client-session.guard';
import { requireClientSession } from './client-sessions.controller';
import type { ChangePhoneRequestHandler } from '../application/change-phone.request';
import type { ChangePhoneVerifyHandler } from '../application/change-phone.verify';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

/** Бандл use cases (гейт max-params): фабрика дістає позиційно. */
export interface ChangePhoneUseCases {
  request: ChangePhoneRequestHandler;
  verify: ChangePhoneVerifyHandler;
}

/** Бандл лімітерів (гейт max-params): обидва кроки + метрика порушень. */
export interface ChangePhoneRateLimits {
  request: RateLimiter;
  verify: RateLimiter;
  violations: RateLimitMetrics;
}

@Controller('identity/phone/change')
@UseGuards(ClientSessionGuard)
@UseFilters(IdentityExceptionFilter)
export class ChangePhoneController {
  constructor(
    @Inject('CHANGE_PHONE_USE_CASES') private readonly useCases: ChangePhoneUseCases,
    @Inject('CHANGE_PHONE_RATE_LIMITS') private readonly limits: ChangePhoneRateLimits
  ) {}

  /** Крок 1: код на новий номер (purpose phone_change). */
  @Post('request')
  async requestCode(@Body() body: RequestPhoneChangeOtpInput): Promise<{ retryAfterSec: number }> {
    await acquireOrThrow429(
      this.limits.request,
      'phone-change-request:' + body.phone,
      this.limits.violations
    );
    return this.useCases.request.handle({ phone: body.phone }).catch((error) => {
      throw toHttp(error);
    });
  }

  /** Крок 2: код з нового номера → перенос номера на той самий User. */
  @Post('verify')
  async verifyCode(
    @Req() req: Request,
    @Body() body: VerifyPhoneChangeInput
  ): Promise<VerifyPhoneChangeResult> {
    await acquireOrThrow429(
      this.limits.verify,
      'phone-change-verify:' + body.phone,
      this.limits.violations
    );
    const session = requireClientSession(req);
    return this.useCases.verify
      .handle({
        userId: session.userId,
        currentSessionId: session.sessionId,
        phone: body.phone,
        code: body.code,
      })
      .catch((error) => {
        throw toHttp(error);
      });
  }
}
