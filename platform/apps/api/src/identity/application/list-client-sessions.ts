// ListClientSessions (T-4422): активні сесії клієнта — «пристрої» у кабінеті.
// Кожна сесія: канал (web/mobile — носій), дата входу, прапорець «це цей
// пристрій». Поточну визначає сервер за хешем токена запиту (клієнтському
// самоприсвоєнню не віримо); канал admin тут не показуємо — це список
// клієнтських пристроїв (ADR 0017: адмінська сесія окрема й ізольована).

import type { SessionRepository } from '../domain/ports';
import type { Session } from '../domain/session';
import type { ListClientSessionsResult } from '@fade/contracts';

export interface ClientSessionItem {
  id: string;
  channel: 'web' | 'mobile';
  /** ISO-рядок за контрактом; всередині — Date. */
  createdAt: string;
  /** Сесія цього самого запиту (поточний пристрій) — вирішує сервер. */
  current: boolean;
}

export class ListClientSessionsHandler {
  constructor(private readonly sessions: Pick<SessionRepository, 'findActiveByUser'>) {}

  async handle(input: {
    userId: string;
    /** Сесія цього самого запиту — її і позначаємо «поточний пристрій». */
    currentSessionId: string;
  }): Promise<ListClientSessionsResult> {
    const rows = await this.sessions.findActiveByUser(input.userId);
    const sessions = rows
      .filter(
        (session): session is Session & { channel: 'web' | 'mobile' } => session.channel !== 'admin'
      )
      // Свіжі входи зверху — список короткий, порядок суто косметичний.
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((session): ClientSessionItem => ({
        id: session.id,
        channel: session.channel,
        createdAt: session.createdAt.toISOString(),
        current: session.id === input.currentSessionId,
      }));
    return { sessions };
  }
}
