// Порт клієнтських даних для waitlist-сценаріїв (T-174…T-182).
export interface ClientRecord {
  id: string;
  name?: string;
  phone?: string;
  visitCount?: number;
  preferredBarberId?: string | null;
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
