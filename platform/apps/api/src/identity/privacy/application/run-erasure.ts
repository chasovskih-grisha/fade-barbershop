// Виконання стирання (T-4805): воркер бере прострочені заявки й анонімізує
// субʼєкта. Збій не втрачає заявку: backoff, після 3 спроб — failed для
// ручного розбору. Фінансові рядки не видаляються — лише PII (ризик задачі).
import {
  anonymizedEmail,
  anonymizedPhone,
  isRetryable,
  nextAttemptAt,
  type ErasureReport,
} from '../domain/erasure-policy';
import type { ErasureObjectStore, ErasureRecord, ErasureStore } from './erasure.ports';

export interface RunErasureDeps {
  store: ErasureStore;
  objects: ErasureObjectStore;
  audit: (event: Record<string, string | number>) => void;
}

export class RunErasure {
  constructor(private readonly deps: RunErasureDeps) {}

  async execute(now: Date = new Date(), limit = 20): Promise<number> {
    const due = await this.deps.store.due(now, limit);
    let completed = 0;
    for (const record of due) {
      if (await this.eraseOne(record, now)) completed++;
    }
    return completed;
  }

  private async eraseOne(record: ErasureRecord, now: Date): Promise<boolean> {
    try {
      await this.deps.store.markAttempt(record.id);
      const result = await this.deps.store.anonymize({
        subject: record.subject,
        replacementPhone: anonymizedPhone(record.subject.userId),
        replacementEmail: anonymizedEmail(record.subject.userId),
        now,
      });
      await this.deps.objects.remove(result.objectKeys).catch(() => undefined);
      const report: ErasureReport = {
        subjectId: record.subject.userId,
        anonymizedFields: result.anonymizedFields,
        sessionsRevoked: result.sessionsRevoked,
        objectsDeleted: result.objectKeys.length,
        completedAt: now.toISOString(),
      };
      await this.deps.store.complete(record.id, report, now);
      this.deps.audit({
        erasureId: record.id,
        subjectId: record.subject.userId,
        status: 'completed',
        attempts: record.attempts + 1,
        objectsDeleted: result.objectKeys.length,
      });
      return true;
    } catch (error) {
      await this.fail(record, error, now);
      return false;
    }
  }

  private async fail(record: ErasureRecord, error: unknown, now: Date): Promise<void> {
    const attempts = record.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    const retryable = isRetryable(attempts);
    await this.deps.store.fail(record.id, message, retryable ? nextAttemptAt(attempts, now) : null);
    this.deps.audit({
      erasureId: record.id,
      subjectId: record.subject.userId,
      status: retryable ? 'pending' : 'failed',
      attempts,
      error: message,
    });
  }
}
