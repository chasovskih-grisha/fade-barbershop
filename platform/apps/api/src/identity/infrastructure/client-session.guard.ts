// Клієнтська сесія для BFF-ендпоінтів пристроїв (T-4422): один гвард для
// web (cookie fadoidx) і mobile (Bearer access). Успіх — у request кладемо
// session (userId, id); інакше 401. Поточний пристрій визначає СЕРВЕР —
// за токеном запиту, клієнтським прапорцям не віримо.

import { CanActivate, Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { hashToken } from '../domain/otp-code';
import { PrismaSessionRepository } from './prisma-session-repository';
import { bearerOf } from './bearer-session.guard';
import { SESSION_COOKIE_NAME } from './session-cookie';

/** Сесія поточного запиту: userId + sessionId («цей пристрій»). */
export interface ClientSession {
  userId: string;
  sessionId: string;
}

export function clientSessionOf(request: Request): ClientSession | undefined {
  return (request as Request & { clientSession?: ClientSession }).clientSession;
}

@Injectable()
export class ClientSessionGuard implements CanActivate {
  // Конкретний клас (патерн AdminSessionGuard): інтерфейс — не Nest-токен.
  constructor(private readonly sessions: PrismaSessionRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const bearer = bearerOf(request);
    const cookie = request.cookies?.[SESSION_COOKIE_NAME];
    const token = bearer || (typeof cookie === 'string' ? cookie : '');
    if (!token) throw new UnauthorizedException('Client session required');

    const session = await this.sessions.findByTokenHash(hashToken(token));
    if (!session || !session.active) throw new UnauthorizedException('Valid session required');
    // ADR 0017: admin-сесія живе на окремому домені і в клієнтські поверхні
    // не пускається — тут лише web/mobile клієнта.
    if (session.channel === 'admin') throw new UnauthorizedException('Client session required');
    if (session.channel === 'mobile' && !session.accessValid(new Date()))
      throw new UnauthorizedException('Access token expired');

    (request as Request & { clientSession?: ClientSession }).clientSession = {
      userId: session.userId,
      sessionId: session.id,
    };
    return true;
  }
}
