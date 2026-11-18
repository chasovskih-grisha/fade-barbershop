// Refresh endpoint (T-014) — POST /identity/auth/refresh. Канал mobile: Bearer
// access + body.refreshToken → нова пара. Rate limit (T-4410) як на OTP-verify:
// перебор refresh-токенів так само небезпечний.

import { Body, Controller, HttpStatus, Inject, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RefreshSessionInput } from '@fade/contracts';
import { RefreshSessionHandler } from '../application/refresh-session';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { OTP_VERIFY_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

@Controller('identity/auth')
@UseFilters(IdentityExceptionFilter)
export class RefreshSessionController {
  constructor(
    private readonly refreshSession: RefreshSessionHandler,
    @Inject(OTP_VERIFY_LIMITER) private readonly limiter: RateLimiter,
    private readonly violations: RateLimitMetrics
  ) {}

  @Post('refresh')
  async refresh(@Body() body: RefreshSessionInput, @Req() req: Request, @Res() res: Response) {
    await acquireOrThrow429(this.limiter, 'auth-refresh:' + clientKey(req), this.violations);
    return this.refreshSession
      .handle({ refreshToken: String(body?.refreshToken ?? '') })
      .then((result) => {
        // 200 (обмін токенів, не створення ресурсу — Nest дефолт для POST — 201).
        res.status(HttpStatus.OK).json({
          token: result.token,
          refreshToken: result.refreshToken,
          expiresInSec: result.expiresInSec,
          user: { id: result.userId, phone: result.phone },
        });
      })
      .catch((error) => {
        throw toHttp(error);
      });
  }
}

/** Ключ лімітера: userId з Bearer неможливо довіряти до валідації —
 * лімітуємо за IP (за проксі див. x-forwarded-for). */
function clientKey(req: Request): string {
  return String(req.headers['x-forwarded-for'] ?? req.ip ?? 'unknown');
}
