import { depositResumeToken, isValidDepositResumeToken } from './deposit-resume-token';

/** Секрет читається на виклик, тож перезавантаження модуля не потрібне — досить env. */
function withSecret<T>(value: string | undefined, fn: () => T): T {
  const prior = process.env.DEPOSIT_RESUME_SECRET;
  if (value === undefined) delete process.env.DEPOSIT_RESUME_SECRET;
  else process.env.DEPOSIT_RESUME_SECRET = value;
  try {
    return fn();
  } finally {
    if (prior === undefined) delete process.env.DEPOSIT_RESUME_SECRET;
    else process.env.DEPOSIT_RESUME_SECRET = prior;
  }
}

describe('deposit resume token', () => {
  it('requires a configured secret', () => {
    withSecret(undefined, () => {
      expect(() => depositResumeToken('booking-1')).toThrow('DEPOSIT_RESUME_SECRET is required');
      expect(() => isValidDepositResumeToken('booking-1', 'x')).toThrow(
        'DEPOSIT_RESUME_SECRET is required'
      );
    });
  });

  it('binds the token to one booking', () => {
    withSecret('shared-secret', () => {
      const bookingToken = depositResumeToken('booking-1');
      expect(isValidDepositResumeToken('booking-1', bookingToken)).toBe(true);
      expect(isValidDepositResumeToken('booking-2', bookingToken)).toBe(false);
      expect(isValidDepositResumeToken('booking-1', 'wrong')).toBe(false);
    });
  });

  it('is not valid when signed with a different secret', () => {
    const token = withSecret('secret-a', () => depositResumeToken('booking-1'));

    withSecret('secret-b', () => {
      expect(isValidDepositResumeToken('booking-1', token)).toBe(false);
    });
  });
});
