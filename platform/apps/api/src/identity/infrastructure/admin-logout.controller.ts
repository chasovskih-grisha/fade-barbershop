import { Controller, Post, HttpCode, HttpStatus, UseFilters, Res } from '@nestjs/common';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { DEFAULT_COOKIE_CONFIG, type CookieConfig } from './session-cookie';
import type { Response } from 'express';
import { buildClearCookie } from './session-cookie';

/** Admin logout – clears the admin‑domain cookie */
@Controller('admin/auth')
@UseFilters(IdentityExceptionFilter)
export class AdminLogoutController {
  private readonly cookieConfig: CookieConfig = DEFAULT_COOKIE_CONFIG;

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res() res: Response): void {
    // Set an empty cookie with immediate expiry.
    const expiredCookie = buildClearCookie('admin', this.cookieConfig);
    res.setHeader('Set-Cookie', expiredCookie);
    res.end();
  }
}
