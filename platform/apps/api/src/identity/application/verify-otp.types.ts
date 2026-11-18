// Типи VerifyOtp — окремо від хендлера (max-lines).

import type { SessionChannel } from '../domain/session';
import type { OtpVerifyResult } from '../domain/otp-challenge';
import type {
  Clock,
  IdGenerator,
  OtpChallengeRepository,
  Outbox,
  SessionRepository,
  UnitOfWork,
  UserRepository,
} from '../domain/ports';

export interface VerifyOtpInput {
  phone: string;
  code: string;
  channel: SessionChannel;
}

export interface VerifyOtpDeps {
  users: UserRepository;
  challenges: OtpChallengeRepository;
  sessions: SessionRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export type VerifyOutcome =
  | {
      status: 'success';
      token: string;
      userId: string;
      phone: string;
      channel: SessionChannel;
      refreshToken: string | null;
      expiresInSec: number | null;
    }
  | { status: 'failure'; result: OtpVerifyResult };

export interface VerifyOtpResult {
  token: string;
  userId: string;
  phone: string;
  channel: SessionChannel;
  /** T-014: тільки для каналу mobile. */
  refreshToken: string | null;
  /** T-014: тільки для mobile — життя access у секундах. */
  expiresInSec: number | null;
}
