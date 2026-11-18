import { Body, Controller, Inject, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AdminLoginInput } from '@fade/contracts';
import { AdminLoginHandler } from '../application/admin-login';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { DEFAULT_COOKIE_CONFIG, type CookieConfig, buildSetCookie } from './session-cookie';
import { ADMIN_LOGIN_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { acquireOrThrow429 } from '../../shared/rate-limit/http-429';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

/**
 * Admin login – username + password (credentials stored in DB, T-013).
 * Only users with role `admin` may create an admin session.
 * Rate limit (T-4410): перебір паролів дешевший за OTP-спам — 5/год на
 * username+IP (прод; dev-дефолт 10), порушення → 429 RATE_LIMITED.
 */
@Controller('admin/auth')
@UseFilters(IdentityExceptionFilter)
export class AdminLoginController {
  private readonly cookieConfig: CookieConfig = DEFAULT_COOKIE_CONFIG;

  constructor(
    private readonly adminLogin: AdminLoginHandler,
    @Inject(ADMIN_LOGIN_LIMITER) private readonly limiter: RateLimiter,
    private readonly violations: RateLimitMetrics
  ) {}

  @Post('login')
  async login(
    @Body() body: AdminLoginInput,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const ip = clientIp(req);
    await acquireOrThrow429(this.limiter, `admin-login:${body.username}:${ip}`, this.violations);
    try {
      const result = await this.adminLogin.handle({
        username: body.username,
        password: body.password,
      });
      res.setHeader('Set-Cookie', buildSetCookie(result.token, 'admin', this.cookieConfig));
      res.status(200).json({
        token: result.token,
        user: { id: result.userId, username: result.username, phone: result.phone },
      });
    } catch (err) {
      throw toHttp(err);
    }
  }
}

/** IP клієнта: за X-Forwarded-For (за реверс-проксі/шлюзом T-4210), інакше сокет. */
function clientIp(req: Request): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0)
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.socket?.remoteAddress ?? 'unknown';
}
