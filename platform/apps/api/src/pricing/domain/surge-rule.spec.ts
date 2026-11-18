// T-4811: матчинг surge-правил і ціна з множником (цілочисельна математика).
import {
  applySurge,
  dayOfWeekUtc,
  matchSurgeRule,
  minuteOfDayUtc,
  ruleSpecificity,
  type SurgeRule,
} from './surge-rule';

const rule = (patch: Partial<SurgeRule>): SurgeRule => ({
  id: 'r1',
  locationId: null,
  dayOfWeek: null,
  fromMinute: null,
  toMinute: null,
  seniorityTier: null,
  multiplierBp: 12_000,
  active: true,
  ...patch,
});

// П'ятниця, 18:30 UTC.
const FRIDAY_EVENING = new Date('2026-11-20T18:30:00Z');
const CTX = { locationId: 'loc-1', start: FRIDAY_EVENING };

describe('surge rules (T-4811)', () => {
  it('день тижня та хвилина доби рахуються в UTC (0 = понеділок)', () => {
    expect(dayOfWeekUtc(FRIDAY_EVENING)).toBe(4);
    expect(minuteOfDayUtc(FRIDAY_EVENING)).toBe(18 * 60 + 30);
  });

  it('без правил surge не застосовується', () => {
    expect(matchSurgeRule([], CTX)).toBeNull();
  });

  it('вибирає специфічніше правило (локація + день + вікно)', () => {
    const generic = rule({ id: 'generic', multiplierBp: 11_000 });
    const specific = rule({
      id: 'specific',
      locationId: 'loc-1',
      dayOfWeek: 4,
      fromMinute: 18 * 60,
      toMinute: 21 * 60,
      multiplierBp: 13_000,
    });
    expect(matchSurgeRule([generic, specific], CTX)?.id).toBe('specific');
  });

  it('при однаковій специфічності виграє вищий множник', () => {
    const low = rule({ id: 'low', dayOfWeek: 4, multiplierBp: 11_000 });
    const high = rule({ id: 'high', dayOfWeek: 4, multiplierBp: 15_000 });
    expect(matchSurgeRule([low, high], CTX)?.id).toBe('high');
  });

  it('вікно поза годиною не матчиться; неактивне правило ігнорується', () => {
    const outside = rule({ fromMinute: 8 * 60, toMinute: 12 * 60 });
    expect(matchSurgeRule([outside], CTX)).toBeNull();
    expect(matchSurgeRule([rule({ active: false })], CTX)).toBeNull();
  });

  it('правило іншої локації не застосовується', () => {
    expect(matchSurgeRule([rule({ locationId: 'loc-2' })], CTX)).toBeNull();
  });

  it('рівень барбера враховується, якщо правило його задає', () => {
    const senior = rule({ seniorityTier: 'senior' });
    expect(matchSurgeRule([senior], { ...CTX, seniorityTier: 'senior' })?.id).toBe('r1');
    expect(matchSurgeRule([senior], { ...CTX, seniorityTier: 'junior' })).toBeNull();
    expect(matchSurgeRule([senior], CTX)).toBeNull();
  });

  it('специфічність монотонна за кількістю обмежень', () => {
    expect(ruleSpecificity(rule({}))).toBe(0);
    expect(ruleSpecificity(rule({ locationId: 'l' }))).toBe(8);
    expect(ruleSpecificity(rule({ locationId: 'l', dayOfWeek: 4, fromMinute: 0, toMinute: 60 }))).toBe(11);
  });

  it('ціна множиться без float і ніколи не падає нижче базової', () => {
    expect(applySurge(20_000, 12_500)).toBe(25_000);
    expect(applySurge(19_900, 11_500)).toBe(22_885);
    expect(applySurge(20_000, 9_000)).toBe(20_000);
    expect(applySurge(Number.NaN, 12_500)).toBe(0);
  });
});
