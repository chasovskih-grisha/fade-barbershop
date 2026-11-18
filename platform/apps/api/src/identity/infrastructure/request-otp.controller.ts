// Request OTP endpoint – POST /identity/otp/request
// Rate limit (T-4410): 5/год на номер — захист спаму SMS-каналу.

import { Body, Controller, Inject, Post, UseFilters } from '@nestjs/common';
import type { RequestOtpInput, RequestOtpResult } from '@fade/contracts';
import { RequestOtpHandler } from '../application/request-otp';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { OTP_REQUEST_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

@Controller('identity/otp')
@UseFilters(IdentityExceptionFilter)
export class RequestOtpController {
  constructor(
    private readonly requestOtp: RequestOtpHandler,
    @Inject(OTP_REQUEST_LIMITER) private readonly limiter: RateLimiter,
    private readonly violations: RateLimitMetrics
  ) {}

  @Post('request')
  async request(@Body() body: RequestOtpInput): Promise<RequestOtpResult> {
    await acquireOrThrow429(this.limiter, 'otp-request:' + body.phone, this.violations);
    return this.requestOtp.handle({ phone: body.phone }).catch((error) => {
      throw toHttp(error);
    });
  }
}
