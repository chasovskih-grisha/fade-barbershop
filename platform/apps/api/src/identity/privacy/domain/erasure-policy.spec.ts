// T-4805: політика стирання — анонімні заміни, backoff, ліміт спроб, аудит без PII.
import { MAX_ERASURE_ATTEMPTS, anonymizedEmail, anonymizedPhone, auditRecord, isRetryable, nextAttemptAt, retryDelayMinutes } from './erasure-policy';
import { uuidv7 } from '@fade/domain-shared';

const ERASURE_ID = uuidv7();

const ID = '0192f0aa-1c2b-7000-8000-abcdef123456';

describe('erasure policy (T-4805)', () => {
  it('заміна номера унікальна для субʼєкта і не містить оригіналу', () => {
    expect(anonymizedPhone(ID)).not.toBe(anonymizedPhone(`${ID}x`));
    expect(anonymizedPhone(ID)).toMatch(/^\+1999[0-9a-f]{32}$/);
  });

  it('заміна email не схожа на реальну адресу', () => {
    expect(anonymizedEmail(ID)).toBe(`erased-${ID}@invalid.local`);
  });

  it('backoff зростає до 60 хв і далі не росте', () => {
    expect([0, 1, 2, 3, 5].map(retryDelayMinutes)).toEqual([5, 10, 20, 40, 60]);
  });

  it('після ліміту спроб заявка не ретраїться', () => {
    expect(isRetryable(MAX_ERASURE_ATTEMPTS - 1)).toBe(true);
    expect(isRetryable(MAX_ERASURE_ATTEMPTS)).toBe(false);
  });

  it('наступна спроба зсувається на backoff від поточного часу', () => {
    const now = new Date('2026-11-17T10:00:00Z');
    expect(nextAttemptAt(1, now).toISOString()).toBe('2026-11-17T10:10:00.000Z');
  });

  it('аудит містить лише id, статус і кількості — без PII', () => {
    const record = auditRecord({
      erasureId: ERASURE_ID,
      subjectId: ID,
      status: 'completed',
      attempts: 1,
      objectsDeleted: 2,
    });
    expect(record).toEqual({
      erasureId: ERASURE_ID,
      subjectId: ID,
      status: 'completed',
      attempts: 1,
      objectsDeleted: 2,
    });
    expect(JSON.stringify(record)).not.toMatch(/\+380|@/);
  });
});
