import { hashPassword, passwordMatches, PASSWORD_MIN_LENGTH } from './password';

describe('Password', () => {
  it('хешує пароль і підтверджує правильний', () => {
    const stored = hashPassword('SuperSecret2026');
    expect(stored.startsWith('scrypt:')).toBe(true);
    expect(stored).not.toContain('SuperSecret2026');
    expect(passwordMatches(stored, 'SuperSecret2026')).toBe(true);
  });

  it('відхиляє невірний пароль', () => {
    const stored = hashPassword('SuperSecret2026');
    expect(passwordMatches(stored, 'SuperSecret2027')).toBe(false);
  });

  it('щоразу інша сіль (унікальний хеш)', () => {
    expect(hashPassword('SuperSecret2026')).not.toBe(hashPassword('SuperSecret2026'));
  });

  it('пошкоджений/сторонній хеш ніколи не збігається', () => {
    expect(passwordMatches('plaintext', 'anything')).toBe(false);
    expect(passwordMatches('scrypt:ab:cd', 'x')).toBe(false);
  });

  it('мінімальна довжина пароля зафіксована', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});
