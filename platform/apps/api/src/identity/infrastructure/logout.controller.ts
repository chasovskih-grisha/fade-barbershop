// Logout endpoint – POST /identity/logout

import { Controller, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RevokeSessionHandler } from '../application/revoke-session';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { DEFAULT_COOKIE_CONFIG, SESSION_COOKIE_NAME, buildClearCookie } from './session-cookie';

@Controller('identity')
@UseFilters(IdentityExceptionFilter)
export class LogoutController {
  constructor(private readonly revokeSession: RevokeSessionHandler) {}

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    return this.revokeSession.handle({ token: token ?? '' }).then(() => {
      res.setHeader('Set-Cookie', [
        buildClearCookie('web', DEFAULT_COOKIE_CONFIG),
        buildClearCookie('admin', DEFAULT_COOKIE_CONFIG),
      ]);
      res.status(200).json({ ok: true });
    });
  }
}
