// Адмін-ендпоінти OTP для телефонного запису (T-4409, admin-screens §6.2):
// POST /admin/clients/otp/request { phone } — ініціювати код на номер клієнта;
// POST /admin/clients/otp/verify { phone, code } — верифікувати прочитаний код.
// T-046: verify для номера без User створює клієнта «на місці» (User у identity
// + ClientProfile у crm через AdminOnboardClientHandler) — окремого ендпоінта
// не потрібно, номер доказано кодом з SMS.
// Усі під AdminSessionGuard (глобальний APP_GUARD для /admin/*);
// actorId — адмін з cookie-сесії (геть із DTO, як у T-4533).
// Rate limit (T-2400c): request шле SMS на номер клієнта — той самий спам-ризик,
// що й клієнтський request OTP, тому 5/год на номер (прод; dev-дефолт високий).
import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminRequestClientOtpHandler, AdminVerifyClientOtpHandler } from '../application/admin-client-otp';
import { toHttp } from './identity-http.mapper';
import { UseFilters } from '@nestjs/common';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

/** Limiter + violation metric bundled so the constructor stays within max-params. */
export const ADMIN_CLIENT_OTP_LIMITS = 'ADMIN_CLIENT_OTP_LIMITS';

export interface AdminClientOtpLimits {
  limiter: RateLimiter;
  violations: RateLimitMetrics;
}

@Controller('admin/clients/otp')
@UseFilters(IdentityExceptionFilter)
export class AdminClientOtpController {
  constructor(
    private readonly requestOtp: AdminRequestClientOtpHandler,
    private readonly verifyOtp: AdminVerifyClientOtpHandler,
    @Inject(ADMIN_CLIENT_OTP_LIMITS) private readonly limits: AdminClientOtpLimits
  ) {}

  @Post('request')
  async request(@Body() body: { phone: string }): Promise<{ retryAfterSec: number }> {
    await acquireOrThrow429(
      this.limits.limiter,
      `admin-client-otp:${body.phone}`,
      this.limits.violations
    );
    return this.requestOtp.handle({ phone: body.phone }).catch((error) => {
      throw toHttp(error);
    });
  }

  @Post('verify')
  async verify(
    @Body() body: { phone: string; code: string },
    @Req() req: Request
  ): Promise<{ phoneVerifiedAt: string; clientId: string }> {
    const actorId = (req as Request & { adminUserId?: string }).adminUserId ?? 'unknown';
    return this.verifyOtp.handle({ phone: body.phone, code: body.code, actorId }).catch((error) => {
      throw toHttp(error);
    });
  }
}
