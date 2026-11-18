// Типи RefreshSession (T-014) — окремо від handler'а: форма контракту без
// залежності від класу (порти — у ../domain/ports).
import type { Clock, Outbox, SessionRepository, UnitOfWork, UserRepository } from '../domain/ports';

export interface RefreshSessionInput {
  refreshToken: string;
}

export interface RefreshSessionDeps {
  sessions: SessionRepository;
  users: UserRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export interface RefreshSessionResult {
  token: string;
  refreshToken: string;
  expiresInSec: number;
  userId: string;
  phone: string;
}
