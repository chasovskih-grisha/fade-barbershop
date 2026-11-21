// Порт клієнтських даних для waitlist-сценаріїв (T-174…T-182).
/** DI-токен: інтерфейс репозиторію не існує в рантаймі. */
export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface ClientRecord {
  id: string;
  name?: string;
  phone?: string;
  visitCount?: number;
  preferredBarberId?: string | null;
  /** Токен пристрою для push (T-176); без нього повідомлення не йде. */
  pushToken?: string | null;
  /** Улюблені послуги (T-178): для бонусу до пріоритету. */
  preferredServices?: string[];
  /** Хто привів клієнта (T-172): реферальний бонус. */
  referredBy?: string | null;
  /** Улюблена локація (T-172): матч локації. */
  preferredLocation?: string | null;
}

/** Один запис історії неявок (T-182): коли і з якої причини. */
export interface NoShowHistoryEntry {
  clientId: string;
  occurredAt: Date;
  reason?: string;
}

export interface ClientRepository {
  getById(clientId: string): Promise<ClientRecord | null>;
  getNoShowHistory(clientId: string, windowDays: number): Promise<NoShowHistoryEntry[]>;
}
