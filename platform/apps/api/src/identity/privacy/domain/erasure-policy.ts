// GDPR right-to-be-forgotten (T-4805): чисті правила стирання. Ніколи не
// тримаємо plaintext PII в аудиті — лише id і хеш номера.

export const MAX_ERASURE_ATTEMPTS = 3;
export const ERASURE_RETRY_BASE_MIN = 5;

export type ErasureStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Заміна номера: унікальна, не схожа на реальний телефон, без PII. */
export function anonymizedPhone(subjectId: string): string {
  return `+1999${subjectId.replace(/-/g, '')}`;
}

export function anonymizedEmail(subjectId: string): string {
  return `erased-${subjectId}@invalid.local`;
}

/** Експоненційний backoff між спробами: 5 → 10 → 20 хв (кеп 60). */
export function retryDelayMinutes(attempt: number): number {
  return Math.min(60, ERASURE_RETRY_BASE_MIN * 2 ** Math.max(0, attempt));
}

export function nextAttemptAt(attempts: number, now: Date): Date {
  return new Date(now.getTime() + retryDelayMinutes(attempts) * 60_000);
}

/** Після MAX_ERASURE_ATTEMPTS робота здається — потрібен ручний розбір. */
export function isRetryable(attempts: number): boolean {
  return attempts < MAX_ERASURE_ATTEMPTS;
}

export interface ErasureReport {
  subjectId: string;
  anonymizedFields: string[];
  sessionsRevoked: number;
  objectsDeleted: number;
  completedAt: string;
}

/** Аудит без PII: тільки id, статус і кількості. */
export interface ErasureAuditRecord {
  erasureId: string;
  subjectId: string;
  status: ErasureStatus;
  attempts: number;
  objectsDeleted?: number;
  error?: string;
}

export function auditRecord(record: ErasureAuditRecord): Record<string, string | number> {
  const base: Record<string, string | number> = {
    erasureId: record.erasureId,
    subjectId: record.subjectId,
    status: record.status,
    attempts: record.attempts,
  };
  if (record.objectsDeleted !== undefined) base.objectsDeleted = record.objectsDeleted;
  if (record.error) base.error = record.error;
  return base;
}
