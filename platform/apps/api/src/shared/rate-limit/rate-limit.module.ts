// RateLimitModule (T-4410): RateLimiter за конфігом — REDIS_URL у проді →
// RedisRateLimiter, інакше in-memory (dev/test, як у геокодера ADR 0050).
// Порушення рахує RateLimitMetrics (експозиція /metrics, T-4204).
import { Module, type Provider } from '@nestjs/common';
import { createRequire } from 'node:module';
import { RedisRateLimiter, type RedisLike } from './redis.rate-limiter';
import { InMemoryRateLimiter } from './in-memory.rate-limiter';
import { RateLimitMetrics } from './rate-limit.metrics';
import type { RateLimiter, RateLimitPolicy } from './rate-limiter';

export const OTP_REQUEST_LIMITER = Symbol('OTP_REQUEST_LIMITER');
export const OTP_VERIFY_LIMITER = Symbol('OTP_VERIFY_LIMITER');
export const ADMIN_LOGIN_LIMITER = Symbol('ADMIN_LOGIN_LIMITER');
export const ADMIN_CLIENT_OTP_LIMITER = Symbol('ADMIN_CLIENT_OTP_LIMITER');
export const RATE_LIMIT_ENV = 'RATE_LIMIT_ENV';

/** Дев-дефолти лімітерів (макс high, щоб dev-прогони не троттлити); префікс
 * ADMIN_LOGIN — виняток: перебір паролів дешевший за SMS, тому навіть у dev
 * ліміт близький до продового (10/год), env-перевизначення — для e2e. */
export function getPolicy(env: NodeJS.ProcessEnv, prefix: string): RateLimitPolicy {
  const isDev = env.NODE_ENV !== 'production' && env.NODE_ENV !== 'stage';
  const devDefault = prefix === 'ADMIN_LOGIN' ? 10 : 1000;
  const max = Number(
    env[`RATE_LIMIT_${prefix}_MAX`] ?? (isDev ? devDefault : prefix === 'ADMIN_LOGIN' ? 5 : 5)
  );
  const windowMs = Number(env[`RATE_LIMIT_${prefix}_WINDOW_MS`] ?? 3_600_000);
  return { max, windowMs };
}

function buildLimiter(policy: RateLimitPolicy, env: NodeJS.ProcessEnv): RateLimiter {
  if (env.REDIS_URL) {
    // Ледачий ioredis: імпорт тут, щоб dev/test без Redis не тягнув пакет.
    const Redis = createRequire(__filename)('ioredis') as new (url: string) => RedisLike;
    return new RedisRateLimiter(new Redis(env.REDIS_URL) as unknown as RedisLike, policy);
  }
  return new InMemoryRateLimiter(policy);
}

const OtpRequestLimiterProvider: Provider = {
  provide: OTP_REQUEST_LIMITER,
  useFactory: (env: NodeJS.ProcessEnv) => buildLimiter(getPolicy(env, 'OTP_REQUEST'), env),
  inject: [RATE_LIMIT_ENV],
};

const OtpVerifyLimiterProvider: Provider = {
  provide: OTP_VERIFY_LIMITER,
  useFactory: (env: NodeJS.ProcessEnv) => buildLimiter(getPolicy(env, 'OTP_VERIFY'), env),
  inject: [RATE_LIMIT_ENV],
};

const AdminLoginLimiterProvider: Provider = {
  provide: ADMIN_LOGIN_LIMITER,
  useFactory: (env: NodeJS.ProcessEnv) => buildLimiter(getPolicy(env, 'ADMIN_LOGIN'), env),
  inject: [RATE_LIMIT_ENV],
};

// T-2400c: admin-request OTP sends SMS to a client number, so it carries the
// same spam risk as the client OTP request; it needs its own limiter.
const AdminClientOtpLimiterProvider: Provider = {
  provide: ADMIN_CLIENT_OTP_LIMITER,
  useFactory: (env: NodeJS.ProcessEnv) => buildLimiter(getPolicy(env, 'ADMIN_CLIENT_OTP'), env),
  inject: [RATE_LIMIT_ENV],
};

@Module({
  providers: [
    { provide: RATE_LIMIT_ENV, useValue: process.env },
    OtpRequestLimiterProvider,
    OtpVerifyLimiterProvider,
    AdminLoginLimiterProvider,
    AdminClientOtpLimiterProvider,
    RateLimitMetrics,
  ],
  exports: [
    OTP_REQUEST_LIMITER,
    OTP_VERIFY_LIMITER,
    ADMIN_LOGIN_LIMITER,
    ADMIN_CLIENT_OTP_LIMITER,
    RateLimitMetrics,
  ],
})
export class RateLimitModule {}
