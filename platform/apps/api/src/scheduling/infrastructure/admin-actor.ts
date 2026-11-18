import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export type AdminActor = { actorId: string; actorRole: 'admin' };

/** Актор адмін-команди — з сесії (AdminSessionGuard кладе adminUserId), не з тіла. */
export function adminActor(req: Request): AdminActor {
  const actorId = (req as Request & { adminUserId?: string }).adminUserId;
  if (!actorId) throw new UnauthorizedException('Admin session required');
  return { actorId, actorRole: 'admin' };
}
