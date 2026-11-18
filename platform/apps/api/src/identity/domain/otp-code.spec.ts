import {
  generateId,
  generateOtpCode,
  generateToken,
  hashOtpCode,
  hashToken,
  otpMatches,
} from './otp-code';

describe('OtpCode', () => {
  it('генерує 6-значний код', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('хешує код з сіллю і звіряє без зберігання відкритого значення', () => {
    const stored = hashOtpCode('123456');
    expect(stored).toMatch(/^[0-9a-f]{16}:[0-9a-f]{64}$/);
    expect(stored).not.toContain('123456');
    expect(otpMatches(stored, '123456')).toBe(true);
    expect(otpMatches(stored, '654321')).toBe(false);
    expect(otpMatches('broken', '123456')).toBe(false);
  });

  it('хеші не повторюються (випадкова сіль)', () => {
    expect(hashOtpCode('123456')).not.toBe(hashOtpCode('123456'));
  });

  it('генерує і хешує токен', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toBe(token);
  });

  it('id унікальні', () => {
    expect(generateId()).not.toBe(generateId());
  });
});
