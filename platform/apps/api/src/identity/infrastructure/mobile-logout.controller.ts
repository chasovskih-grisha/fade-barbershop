// Mobile logout (T-014) — POST /identity/auth/logout: Bearer access → ріже
// сесію цілком (і access, і refresh — джерело правди одне, RevokeSession).

import { Controller, HttpStatus, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RevokeSessionHandler } from '../application/revoke-session';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { bearerOf } from './bearer-session.guard';

@Controller('identity/auth')
@UseFilters(IdentityExceptionFilter)
export class MobileLogoutController {
  constructor(private readonly revokeSession: RevokeSessionHandler) {}

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.revokeSession.handle({ token: bearerOf(req) });
    res.status(HttpStatus.OK).json({ ok: result.ok });
  }
}
