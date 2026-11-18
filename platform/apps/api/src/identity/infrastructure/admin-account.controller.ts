// Життєвий цикл адмін-обліковки (T-4411, admin-screens §0). Усі маршрути під
// AdminSessionGuard: actorId — з cookie-сесії (геть із DTO, як у T-4409).
// POST /admin/account/password    — зміна власного (current+new);
// POST /admin/admins/:id/password — скидання пароля іншому адміну (→ новий);
// POST /admin/admins/:id/active   — блокування/розблокування;
// GET  /admin/admins/:id/logins   — журнал останніх входів/невдач.
import { Body, Controller, Get, Param, Post, Query, Req, UseFilters } from '@nestjs/common';
import type { Request } from 'express';
import { toHttp } from './identity-http.mapper';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { AdminAccountIO } from './admin-account.io';

export { AdminAccountIO } from './admin-account.io';

function actorOf(req: Request): string {
  return (req as Request & { adminUserId?: string }).adminUserId ?? 'unknown';
}

@Controller()
@UseFilters(IdentityExceptionFilter)
export class AdminAccountController {
  constructor(private readonly io: AdminAccountIO) {}

  @Post('admin/account/password')
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: Request
  ): Promise<{ changedAt: string }> {
    return this.io.changeOwn
      .handle({
        actorId: actorOf(req),
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      })
      .catch((e) => {
        throw toHttp(e);
      });
  }

  @Post('admin/admins/:id/password')
  async resetPassword(
    @Param('id') targetUserId: string,
    @Req() req: Request
  ): Promise<{ newPassword: string }> {
    return this.io.reset.handle({ actorId: actorOf(req), targetUserId }).catch((e) => {
      throw toHttp(e);
    });
  }

  @Post('admin/admins/:id/active')
  async setActive(
    @Param('id') targetUserId: string,
    @Body() body: { active: boolean },
    @Req() req: Request
  ): Promise<{ active: boolean; closedSessions: number }> {
    return this.io.active
      .handle({ actorId: actorOf(req), targetUserId, active: Boolean(body.active) })
      .catch((e) => {
        throw toHttp(e);
      });
  }

  @Get('admin/admins/:id/logins')
  async logins(@Param('id') targetUserId: string, @Query('limit') limit?: string) {
    return this.io.audit
      .handle(
        limit === undefined
          ? { userId: targetUserId }
          : { userId: targetUserId, limit: Number(limit) }
      )
      .catch((e) => {
        throw toHttp(e);
      });
  }

  /** Owner-подання (read-side, той самий AdminSessionGuard): журнал усіх
   * адміністраторів; ?userId= — фільтр за користувачем. */
  @Get('admin/admins/logins')
  async allLogins(@Query('userId') userId?: string, @Query('limit') limit?: string) {
    return this.io.allLogins
      .handle({
        ...(userId ? { userId } : {}),
        ...(limit !== undefined ? { limit: Number(limit) } : {}),
      })
      .catch((e) => {
        throw toHttp(e);
      });
  }
}
