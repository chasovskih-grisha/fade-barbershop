// Клієнтська заявка на стирання (T-4805): спершу доводить номер OTP-кодом,
// потім фіксує запит. Повторна заявка ідемпотентна — повертає наявний рядок.
import { createHash } from 'node:crypto';
import {
  ErasureOtpInvalidError,
  ErasureSubjectNotFoundError,
  type ErasureOtpVerifier,
  type ErasureRecord,
  type ErasureStore,
} from './erasure.ports';

export interface RequestErasureDeps {
  store: ErasureStore;
  otp: ErasureOtpVerifier;
}

export function phoneHash(phone: string): string {
  return createHash('sha256').update(phone.trim()).digest('hex');
}

export class RequestErasure {
  constructor(private readonly deps: RequestErasureDeps) {}

  async execute(input: { phone: string; code: string }, now: Date = new Date()): Promise<ErasureRecord> {
    const phone = input.phone.trim();
    if (!(await this.deps.otp.verify(phone, input.code, now))) throw new ErasureOtpInvalidError();
    const subject = await this.deps.store.findSubjectByPhone(phone);
    if (!subject) throw new ErasureSubjectNotFoundError();
    return this.deps.store.request(subject.userId, phoneHash(phone), now);
  }
}
