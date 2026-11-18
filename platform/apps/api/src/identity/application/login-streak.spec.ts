// Специфікація серії невдалих входів (T-4411 signals): failedStreakOf —
// підряд невдалі спроби на голові кільця одного користувача; записи інших
// адмінів (в owner-поданні) серію не переривають.
import { failedStreakOf } from './list-login-audit';

const e = (ok: boolean, userId?: string, username = 'owner') =>
  userId === undefined ? { ok, username } : { ok, userId, username };

describe('failedStreakOf', () => {
  it('порожній список і успішна голова — null', () => {
    expect(failedStreakOf([])).toBeNull();
    expect(failedStreakOf([e(true, 'a')])).toBeNull();
  });

  it('підряд невдалі на голові — їх кількість', () => {
    expect(failedStreakOf([e(false, 'a'), e(false, 'a'), e(false, 'a')])).toBe(3);
  });

  it('успіх того самого користувача зупиняє підрахунок', () => {
    expect(failedStreakOf([e(false, 'a'), e(false, 'a'), e(true, 'a'), e(false, 'a')])).toBe(2);
  });

  it('записи інших адмінів між невдачами серію НЕ переривають (owner-подання)', () => {
    const interleaved = [
      e(false, 'a', 'owner'),
      e(true, 'b', 'support'),
      e(false, 'a', 'owner'),
      e(false, 'a', 'owner'),
    ];
    expect(failedStreakOf(interleaved)).toBe(3);
  });

  it('успіх ІНШОГО користувача не зупиняє серію першого', () => {
    const mixed = [e(false, 'a', 'owner'), e(true, 'b', 'support'), e(false, 'a', 'owner')];
    expect(failedStreakOf(mixed)).toBe(2);
  });

  it('без userId (власний журнал) — групування за username', () => {
    expect(
      failedStreakOf([
        { ok: false, username: 'owner' },
        { ok: false, username: 'owner' },
      ])
    ).toBe(2);
    // Успіх іншого користувача не зупиняє серію owner'а (чесно для owner-подання).
    expect(
      failedStreakOf([
        { ok: false, username: 'owner' },
        { ok: true, username: 'other' },
      ])
    ).toBe(1);
  });
});
