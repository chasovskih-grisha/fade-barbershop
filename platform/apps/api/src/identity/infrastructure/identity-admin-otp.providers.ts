// Admin client OTP rate limit (T-2400c): the request endpoint sends SMS to a
// client number, so it carries the same spam risk as the client OTP request.
// Bundled into one token so the controller stays within max-params.

import type { Provider } from '@nestjs/common';
import { ADMIN_CLIENT_OTP_LIMITS } from './admin-client-otp.controller';
import { ADMIN_CLIENT_OTP_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

export const identityAdminOtpProviders: Provider[] = [
  {
    provide: ADMIN_CLIENT_OTP_LIMITS,
    useFactory: (limiter: RateLimiter, violations: RateLimitMetrics) => ({
      limiter,
      violations,
    }),
    inject: [ADMIN_CLIENT_OTP_LIMITER, RateLimitMetrics],
  },
];
