// Типи ChangePhone (T-4620a) — окремо від хендлерів (max-lines).

import type {
  Clock,
  IdGenerator,
  OtpChallengeRepository,
  OtpSender,
  Outbox,
  SessionRepository,
  UnitOfWork,
  UserRepository,
} from '../domain/ports';

export interface ChangePhoneDeps {
  users: UserRepository;
  challenges: OtpChallengeRepository;
  sessions: SessionRepository;
  sender: OtpSender;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export interface ChangePhoneRequestResult {
  retryAfterSec: number;
}

export interface ChangePhoneVerifyInput {
  /** Поточний користувач (з активної сесії). */
  userId: string;
  /** Сесія цього запиту — її лишаємо живою, решту ревокуємо. */
  currentSessionId: string;
  phone: string;
  code: string;
}

export interface ChangePhoneVerifyResult {
  ok: true;
  phone: string;
}
