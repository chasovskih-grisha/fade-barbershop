// Фейки портів стирання (T-4805) для юніт-тестів без Prisma/MinIO.
import type { ErasureReport, ErasureStatus } from '../domain/erasure-policy';
import type {
  AnonymizationResult,
  ErasureObjectStore,
  ErasureOtpVerifier,
  ErasureRecord,
  ErasureStore,
  ErasureSubject,
} from './erasure.ports';
import { uuidv7 } from '@fade/domain-shared';

export const USER_ID = uuidv7();

export class FakeErasureStore implements ErasureStore {
  readonly rows: (ErasureRecord & { nextAttemptAt: Date; report?: ErasureReport })[] = [];
  readonly anonymized: string[] = [];
  readonly failures: { id: string; error: string; nextAttemptAt: Date | null }[] = [];
  subject: ErasureSubject | null = { userId: USER_ID };
  anonymizeError: Error | null = null;
  private seq = 0;

  async findSubjectByPhone(): Promise<ErasureSubject | null> {
    return this.subject;
  }

  async request(subjectId: string, _phoneHash: string, now: Date): Promise<ErasureRecord> {
    const existing = this.rows.find((row) => row.subject.userId === subjectId);
    if (existing) {
      existing.status = 'pending';
      existing.nextAttemptAt = now;
      return existing;
    }
    const record = {
      id: `erasure-${++this.seq}`,
      subject: { userId: subjectId },
      status: 'pending' as ErasureStatus,
      attempts: 0,
      nextAttemptAt: now,
    };
    this.rows.push(record);
    return record;
  }

  async due(now: Date): Promise<ErasureRecord[]> {
    return this.rows.filter((row) => row.status === 'pending' && row.nextAttemptAt <= now);
  }

  async markAttempt(id: string): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (row) {
      row.status = 'processing';
      row.attempts += 1;
    }
  }

  async anonymize(input: { subject: ErasureSubject }): Promise<AnonymizationResult> {
    if (this.anonymizeError) throw this.anonymizeError;
    this.anonymized.push(input.subject.userId);
    return {
      anonymizedFields: ['User.phone', 'ClientProfile'],
      sessionsRevoked: 2,
      objectKeys: ['photos/a.jpg', 'photos/b.jpg'],
    };
  }

  async complete(id: string, report: ErasureReport, now: Date): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (!row) return;
    row.status = 'completed';
    row.nextAttemptAt = now;
    row.report = report;
  }

  async fail(id: string, error: string, nextAttemptAt: Date | null): Promise<void> {
    this.failures.push({ id, error, nextAttemptAt });
    const row = this.rows.find((item) => item.id === id);
    if (row) row.status = nextAttemptAt ? 'pending' : 'failed';
  }
}

export class FakeObjects implements ErasureObjectStore {
  readonly removed: string[][] = [];
  async remove(objectKeys: readonly string[]): Promise<void> {
    this.removed.push([...objectKeys]);
  }
}

export class FakeOtp implements ErasureOtpVerifier {
  constructor(private readonly validCode = '123456') {}
  async verify(_phone: string, code: string): Promise<boolean> {
    return code === this.validCode;
  }
}
