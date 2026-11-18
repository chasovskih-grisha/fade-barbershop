// Політики лімітерів (T-4410): ADMIN_LOGIN — виняток із dev-дефолтів.
// Перебір паролів дешевший за SMS-спам, тому навіть у dev ліміт близький
// до продового; env-перевизначення (RATE_LIMIT_ADMIN_LOGIN_*) — для e2e.

import { getPolicy } from './rate-limit.module';

function envOf(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { ...overrides } as NodeJS.ProcessEnv;
}

describe('RateLimitModule policies (T-4410 extension)', () => {
  it('ADMIN_LOGIN: прод-дефолт 5/год незалежно від NODE_ENV', () => {
    expect(getPolicy(envOf({ NODE_ENV: 'production' }), 'ADMIN_LOGIN')).toEqual({
      max: 5,
      windowMs: 3_600_000,
    });
    expect(getPolicy(envOf({ NODE_ENV: 'stage' }), 'ADMIN_LOGIN')).toEqual({
      max: 5,
      windowMs: 3_600_000,
    });
  });

  it('ADMIN_LOGIN: dev-дефолт 10/год (близький до продового, не 1000)', () => {
    expect(getPolicy(envOf({ NODE_ENV: 'development' }), 'ADMIN_LOGIN')).toEqual({
      max: 10,
      windowMs: 3_600_000,
    });
  });

  it('OTP-префікси зберігають старі дев-дефолти (1000/год) — регресія', () => {
    expect(getPolicy(envOf({ NODE_ENV: 'development' }), 'OTP_REQUEST').max).toBe(1000);
    expect(getPolicy(envOf({ NODE_ENV: 'development' }), 'OTP_VERIFY').max).toBe(1000);
    expect(getPolicy(envOf({ NODE_ENV: 'production' }), 'OTP_REQUEST').max).toBe(5);
  });

  it('ADMIN_CLIENT_OTP: прод-дефолт 5/год як клієнтський request OTP (T-2400c)', () => {
    expect(getPolicy(envOf({ NODE_ENV: 'production' }), 'ADMIN_CLIENT_OTP')).toEqual({
      max: 5,
      windowMs: 3_600_000,
    });
    expect(getPolicy(envOf({ NODE_ENV: 'development' }), 'ADMIN_CLIENT_OTP').max).toBe(1000);
  });

  it('env-перевизначення перемагає дефолти (RATE_LIMIT_ADMIN_LOGIN_MAX/WINDOW_MS)', () => {
    expect(
      getPolicy(
        envOf({
          NODE_ENV: 'production',
          RATE_LIMIT_ADMIN_LOGIN_MAX: '3',
          RATE_LIMIT_ADMIN_LOGIN_WINDOW_MS: '60000',
        }),
        'ADMIN_LOGIN'
      )
    ).toEqual({ max: 3, windowMs: 60_000 });
  });
});
