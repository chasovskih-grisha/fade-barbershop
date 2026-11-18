// Bearer-гвард mobile-каналу (T-014): Authorization: Bearer <access> → сесія.
// Access живе хвилини (accessExpiresAt, серверний Clock) — прострочений → 401;
// refresh НЕ приймається як access. Web/admin ходять через cookie-гварди.

import { CanActivate, Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { hashToken } from '../domain/otp-code';
import type { Clock, SessionRepository } from '../domain/ports';

export function bearerOf(request: Request): string {
  const header = request.headers['authorization'];
  if (typeof header !== 'string') return '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? '';
}

@Injectable()
export class BearerSessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerOf(request);
    if (!token) throw new UnauthorizedException('Bearer token required');

    const session = await this.sessions.findByTokenHash(hashToken(token));
    if (!session) throw new UnauthorizedException('Valid bearer token required');
    if (!session.active) throw new UnauthorizedException('Session revoked');
    if (!session.accessValid(this.clock.now()))
      throw new UnauthorizedException('Access token expired');

    (request as Request & { sessionUserId?: string }).sessionUserId = session.userId;
    return true;
  }
}
