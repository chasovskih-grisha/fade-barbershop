// Типи AdminLogin (T-013) — окремо від хендлера (max-lines).

import type { SessionChannel } from '../domain/session';
import type {
  Clock,
  IdGenerator,
  LoginAudit,
  Outbox,
  SessionRepository,
  UnitOfWork,
  UserRepository,
} from '../domain/ports';

export interface AdminLoginInput {
  username: string;
  password: string;
}

export interface AdminLoginDeps {
  users: UserRepository;
  sessions: SessionRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
  /** Журнал входів (T-4411): успіхи і невдачі. */
  audit: LoginAudit;
}

export interface AdminLoginResult {
  token: string;
  userId: string;
  username: string;
  phone: string;
  channel: SessionChannel;
}
