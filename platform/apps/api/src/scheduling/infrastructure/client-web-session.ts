// Web-сесія клієнта з cookie fadoidx (ADR 0017). Список візитів вимагає сесію;
// підтвердження запису — ні: гість лишається гостем, увійшовший стає clientId.

import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { hashToken } from '../../identity/domain/otp-code';
import { SESSION_COOKIE_NAME } from '../../identity/infrastructure/session-cookie';
import type { PrismaService } from '../../shared/prisma/prisma.service';

export function webClientId(req: Request, prisma: PrismaService, required: true): Promise<string>;
export function webClientId(
  req: Request,
  prisma: PrismaService,
  required: false
): Promise<string | null>;
export async function webClientId(
  req: Request,
  prisma: PrismaService,
  required: boolean
): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof token !== 'string' || token.length === 0) return missing(required);
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.revokedAt || session.channel !== 'web') return missing(required);
  return session.userId;
}

// Реалізація сигнатури: required-бул без юніонного звуження всередині
// (impl-сигнатура приймає boolean, повертає null — never-гілку виражає throw).
function missing(required: boolean): null {
  if (required) throw new UnauthorizedException('Client session required');
  return null;
}
