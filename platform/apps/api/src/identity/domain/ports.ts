// Порти identity — контракти, які домен і use cases вимагають від інфраструктури.
// Код домену залежить лише від цих інтерфейсів (напрям залежностей: infra → application → domain).

import type { DomainEvent } from './events';
import type { OtpChallenge } from './otp-challenge';
import type { OtpPurpose } from './otp-challenge.data';
import type { PushToken } from './push-token';
import type { Session } from './session';
import type { User } from './user';
import type { Role } from './role';

/** Призначення OTP-коду: вхід (дефолт), верифікація номера для телефонного
 * запису (T-4409) або зміна номера клієнта (T-4620) — впливає на шаблон
 * повідомлення і на те, який сценарій код дозволено завершити.
 * Визначення типу — у leaf-модулі otp-challenge.data (щоб шалендж не залежав
 * від ports); тут — публічна точка імпорту для use cases. */
export type { OtpPurpose } from './otp-challenge.data';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  listByRole(role: Role): Promise<User[]>;
  save(user: User): Promise<void>;
  /** T-4422: хтось уже зайняв цю адресу? (спільна адреса = чужі сповіщення). */
  findByEmail(email: string): Promise<User | null>;
}

/** Push-токени пристроїв (T-070/T-4422). Токен унікальний глобально: один
 * апарат = один рядок, тож перелогін переносить токен на нову сесію. */
export interface PushTokenRepository {
  findByToken(token: string): Promise<PushToken | null>;
  save(token: PushToken): Promise<void>;
  /** Відкликати канал цього користувача; false — рядка немає або вже глухий. */
  revokeByToken(token: string, userId: string, at: Date): Promise<boolean>;
}

export interface OtpChallengeRepository {
  findLastByPhone(phone: string): Promise<OtpChallenge | null>;
  save(challenge: OtpChallenge): Promise<void>;
}

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  /** T-014: сесія за хешем refresh-токена (канал mobile). */
  findByRefreshHash(refreshHash: string): Promise<Session | null>;
  /** T-4422: активні сесії користувача (список пристроїв). */
  findActiveByUser(userId: string): Promise<Session[]>;
  /** T-014: reuse-детект — сесія, у якої presented-хеш = попередній refresh
   * (один крок історії). Опційний: фейк/адаптер може не тримати історію,
   * тоді reuse «невідомого» токена виглядає як INVALID (теж 401). */
  findByPreviousRefreshHash?(previousHash: string): Promise<Session | null>;
  /** T-014: CAS-ротація токенів — оновлює access/refresh/expiry ЛИШЕ якщо
   * поточний refresh-хеш у БД дорівнює expectedRefreshHash (гонка двох
   * одночасних refresh: виграє один, другий отримує 0 → 401). */
  rotateTokens(input: {
    sessionId: string;
    expectedRefreshHash: string;
    accessHash: string;
    refreshTokenHash: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }): Promise<number>;
  /** Інвалідовує всі активні сесії користувача (T-4411: після зміни/скидання
   * пароля або блокування). Повертає кількість закритих. */
  revokeAllForUser(userId: string, now: Date): Promise<number>;
}

export interface OtpSender {
  /** purpose: 'login' (дефолт), 'booking' (T-4409, суфікс «для запису
   * по телефону») або 'phone_change' (T-4620, «для зміни номера телефону»).
   * Реалізації зобов'язані НЕ логувати digits. */
  send(phone: string, digits: string, purpose?: OtpPurpose): Promise<void>;
}

export interface Outbox {
  append(events: readonly DomainEvent[]): Promise<void>;
}

/** Журнал входів адміна (T-4411, споживає T-3604): успіхи і невдачі.
 * username — як вводив клієнт (успіх і невдача однаково цікаві). */
export interface LoginAttempt {
  ts: Date;
  username: string;
  ok: boolean;
  actorId: string | null;
}

export interface LoginAudit {
  record(userId: string, attempt: LoginAttempt): Promise<void>;
  list(userId: string, limit: number): Promise<LoginAttempt[]>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}
