// Порти стирання (T-4805): use cases не знають про Prisma, MinIO чи HTTP.
import type { ErasureReport, ErasureStatus } from '../domain/erasure-policy';

export const ERASURE_STORE = 'ERASURE_STORE';
export const ERASURE_OBJECTS = 'ERASURE_OBJECTS';
export const ERASURE_OTP = 'ERASURE_OTP';

export interface ErasureSubject {
  userId: string;
}

export interface ErasureRecord {
  id: string;
  subject: ErasureSubject;
  status: ErasureStatus;
  attempts: number;
}

export interface AnonymizationResult {
  anonymizedFields: string[];
  sessionsRevoked: number;
  objectKeys: string[];
}

export interface ErasureStore {
  /** Знайти користувача за номером; null — акаунта немає (не розкриваємо чий). */
  findSubjectByPhone(phone: string): Promise<ErasureSubject | null>;
  /** Створити або повернути наявний запит на стирання (ідемпотентно). */
  request(subjectId: string, phoneHash: string, now: Date): Promise<ErasureRecord>;
  due(now: Date, limit: number): Promise<ErasureRecord[]>;
  markAttempt(id: string): Promise<void>;
  /** Анонімізувати User/ClientProfile, відкликати сесії; повертає ключі фото. */
  anonymize(input: {
    subject: ErasureSubject;
    replacementPhone: string;
    replacementEmail: string;
    now: Date;
  }): Promise<AnonymizationResult>;
  complete(id: string, report: ErasureReport, now: Date): Promise<void>;
  /** nextAttemptAt=null — спроби вичерпано, заявка потребує ручного розбору. */
  fail(id: string, error: string, nextAttemptAt: Date | null): Promise<void>;
}

export interface ErasureObjectStore {
  remove(objectKeys: readonly string[]): Promise<void>;
}

/** Перевірка OTP перед прийняттям заявки: без коду номер не доведений. */
export interface ErasureOtpVerifier {
  verify(phone: string, code: string, now: Date): Promise<boolean>;
}

export class ErasureOtpInvalidError extends Error {
  constructor() {
    super('OTP code is invalid or expired');
    this.name = 'ErasureOtpInvalidError';
  }
}

export class ErasureSubjectNotFoundError extends Error {
  constructor() {
    super('Account not found');
    this.name = 'ErasureSubjectNotFoundError';
  }
}
