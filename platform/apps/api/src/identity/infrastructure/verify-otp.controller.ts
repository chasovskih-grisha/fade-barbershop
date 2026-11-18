// Verify OTP endpoint – POST /identity/otp/verify
// Rate limit (T-4410): 10/год на номер — захист перебору кодів.

import { Body, Controller, Inject, Post, Res, UseFilters } from '@nestjs/common';
import type { Response } from 'express';
import type { VerifyOtpInput } from '@fade/contracts';
import { VerifyOtpHandler } from '../application/verify-otp';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { DEFAULT_COOKIE_CONFIG, type CookieConfig, buildSetCookie } from './session-cookie';
import { toHttp } from './identity-http.mapper';
import { OTP_VERIFY_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

@Controller('identity/otp')
@UseFilters(IdentityExceptionFilter)
export class VerifyOtpController {
  private readonly cookieConfig: CookieConfig = DEFAULT_COOKIE_CONFIG;

  constructor(
    private readonly verifyOtp: VerifyOtpHandler,
    @Inject(OTP_VERIFY_LIMITER) private readonly limiter: RateLimiter,
    private readonly violations: RateLimitMetrics
  ) {}

  @Post('verify')
  async verify(@Body() body: VerifyOtpInput, @Res() res: Response): Promise<void> {
    await acquireOrThrow429(this.limiter, 'otp-verify:' + body.phone, this.violations);
    return this.verifyOtp
      .handle({ phone: body.phone, code: body.code, channel: body.channel ?? 'web' })
      .then((result) => {
        if (result.channel !== 'mobile') {
          res.setHeader(
            'Set-Cookie',
            buildSetCookie(result.token, result.channel, this.cookieConfig)
          );
          res
            .status(200)
            .json({ token: result.token, user: { id: result.userId, phone: result.phone } });
          return;
        }
        // T-014: mobile отримує пару bearer-токенів (без cookie).
        res.status(200).json({
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
