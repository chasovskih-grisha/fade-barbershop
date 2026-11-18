// Мапінг Prisma Session-рядка → доменний Session (окремо від репозиторію).

import { Session, type SessionChannel } from '../domain/session';

export type SessionRow = {
  id: string;
  userId: string;
  channel: string;
  tokenHash: string;
  refreshTokenHash: string | null;
  previousRefreshHash: string | null;
  accessExpiresAt: Date | null;
  refreshExpiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
};

export function reconstituteSession(row: SessionRow): Session {
  return Session.reconstitute({
    id: row.id,
    userId: row.userId,
    channel: row.channel as SessionChannel,
    tokenHash: row.tokenHash,
    refreshTokenHash: row.refreshTokenHash,
    previousRefreshHash: row.previousRefreshHash,
    accessExpiresAt: row.accessExpiresAt,
    refreshExpiresAt: row.refreshExpiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt,
  });
}
