// Форма даних Session — окремо від класу (session.ts): репозиторії/порти
// імпортують тип без залежності від доменної поведінки.

export const SESSION_CHANNELS = ['web', 'mobile', 'admin'] as const;
export type SessionChannel = (typeof SESSION_CHANNELS)[number];

export interface SessionData {
  id: string;
  userId: string;
  channel: SessionChannel;
  /** Хеш поточного access-токена (cookie web/admin або bearer mobile). */
  tokenHash: string;
  /** T-014: хеш поточного refresh-токена (канал mobile). Web/admin — null. */
  refreshTokenHash: string | null;
  /** T-014: хеш refresh ПЕРЕД останньою ротацією — one-step reuse-детект
   * (загублена відповідь/крадіжка старого токена). Багатокрокова історія — T-3604. */
  previousRefreshHash: string | null;
  /** T-014: до коли живе access-токен (серверний Clock, TTL з env). */
  accessExpiresAt: Date | null;
  /** T-014: до коли живе refresh (ротація продовжує); прострочений → 401. */
  refreshExpiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}
