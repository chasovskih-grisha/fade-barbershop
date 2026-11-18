import { OtpChallenge } from './otp-challenge';
import { hashOtpCode } from './otp-code';
import { CHALLENGE_1 } from '../application/test-ids';

const T0 = '2026-09-21T10:00:00.000Z';

function challenge(now: Date, digits = '123456'): OtpChallenge {
  return OtpChallenge.create({
    id: CHALLENGE_1,
    phone: '380501234567',
    codeHash: hashOtpCode(digits),
    now,
  });
}

describe('OtpChallenge', () => {
  it('бодай раз успішно верифікує і одразу стає used', () => {
    const ch = challenge(new Date(T0));
    expect(ch.verify(new Date(T0), '123456')).toBe('ok');
    expect(ch.usedAt).not.toBeNull();
    expect(ch.verify(new Date(T0), '123456')).toBe('used');
  });

  it('термін дії 5 хв — після expiresAt коду expired', () => {
    const ch = challenge(new Date(T0), '123456');
    const after = new Date(Date.parse(T0) + 5 * 60_000 + 1_000);
    expect(ch.verify(after, '123456')).toBe('expired');
  });

  it('ліміт 5 спроб → блокування на 10 хв', () => {
    const ch = challenge(new Date(T0), '123456');
    for (let i = 1; i < 5; i++) expect(ch.verify(new Date(T0), '000000')).toBe('invalid');
    expect(ch.verify(new Date(T0), '000000')).toBe('too_many_attempts');
    expect(ch.lockedUntil).not.toBeNull();
    expect(ch.verify(new Date(T0), '123456')).toBe('locked');
    // Після зняття блокування код вже протермінований (TTL 5 хв < блокування 10 хв).
    const afterLock = new Date(Date.parse(T0) + 10 * 60_000 + 1_000);
    expect(ch.verify(afterLock, '123456')).toBe('expired');
  });

  it('повторний запит — не раніше ніж через 60 с', () => {
    const ch = challenge(new Date(T0));
    expect(ch.canResend(new Date(T0))).toBe(false);
    expect(ch.canResend(new Date(Date.parse(T0) + 59_000))).toBe(false);
    expect(ch.canResend(new Date(Date.parse(T0) + 61_000))).toBe(true);
  });

  it('reconstitute відновлює стан', () => {
    const original = challenge(new Date(T0), '123456');
    original.verify(new Date(T0), '000000');
    const restored = OtpChallenge.reconstitute({
      id: original.id,
      phone: original.phone,
      codeHash: original.codeHash,
      purpose: original.purpose,
      expiresAt: original.expiresAt,
      resendAfter: original.resendAfter,
      attempts: original.attempts,
      lockedUntil: original.lockedUntil,
      usedAt: original.usedAt,
      createdAt: new Date(T0),
    });
    expect(restored.attempts).toBe(1);
    expect(restored.verify(new Date(T0), '123456')).toBe('ok');
  });
});
