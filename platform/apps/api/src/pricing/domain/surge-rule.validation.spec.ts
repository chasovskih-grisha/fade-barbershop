// T-4811: некоректне правило не зберігається (вікно, рівень, множник).
import { validateSurgeRule } from './surge-rule.validation';

describe('validateSurgeRule (T-4811)', () => {
  it('приймає коректне правило', () => {
    expect(
      validateSurgeRule({ dayOfWeek: 4, fromMinute: 1080, toMinute: 1260, multiplierBp: 12_500 })
    ).toEqual({
      ok: true,
    });
  });

  it('порожні обмеження валідні (правило «завжди»)', () => {
    expect(validateSurgeRule({ multiplierBp: 11_000 }).ok).toBe(true);
  });

  it('вікно має бути парою з from < to ≤ 1440', () => {
    expect(validateSurgeRule({ fromMinute: 600 }).ok).toBe(false);
    expect(validateSurgeRule({ fromMinute: 600, toMinute: 600 }).ok).toBe(false);
    expect(validateSurgeRule({ fromMinute: 600, toMinute: 1500 }).ok).toBe(false);
  });

  it('день тижня — 0..6', () => {
    expect(validateSurgeRule({ dayOfWeek: 7 }).ok).toBe(false);
    expect(validateSurgeRule({ dayOfWeek: -1 }).ok).toBe(false);
  });

  it('рівень барбера — з відомого набору', () => {
    expect(validateSurgeRule({ seniorityTier: 'senior' }).ok).toBe(true);
    expect(validateSurgeRule({ seniorityTier: 'legend' }).ok).toBe(false);
  });

  it('множник не знижує ціну і має верхню межу', () => {
    expect(validateSurgeRule({ multiplierBp: 9_500 }).ok).toBe(false);
    expect(validateSurgeRule({ multiplierBp: 60_000 }).ok).toBe(false);
    expect(validateSurgeRule({ multiplierBp: 12_345 }).ok).toBe(true);
  });
});
