import { Controller, Get, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { hashToken } from '../domain/otp-code';
import { PrismaUserRepository } from '../infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { SESSION_COOKIE_NAME } from './session-cookie';

/** Returns the current admin user based on the admin session cookie */
@Controller('admin/auth')
@UseFilters(IdentityExceptionFilter)
export class AdminMeController {
  constructor(
    private readonly users: PrismaUserRepository,
    private readonly sessions: PrismaSessionRepository
  ) {}

  @Get('me')
  async me(@Req() req: Request, @Res() res: Response): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    const session = await this.sessions.findByTokenHash(hashToken(token));
    if (!session || session.revokedAt) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    if (session.channel !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const user = await this.users.findById(session.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({
      id: user.id,
      phone: user.phone.value,
      username: user.username ?? null,
      name: user.name,
      role: user.role,
    });
  }
}
