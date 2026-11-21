// Чернетка правила surge (T-4811): межі ті самі, що перевіряє API, і жодного
// «тихого» 0 — порожнє вікно лишається null, а не опівніччю.
import {
  EMPTY_DRAFT,
  draftError,
  minutesToTime,
  timeToMinutes,
  toDraft,
  toPayload,
} from './surge-rule-draft';

const ROW = {
  id: 'r1',
  locationId: 'loc-1',
  dayOfWeek: 4,
  fromMinute: 1080,
  toMinute: 1260,
  seniorityTier: 'senior' as const,
  multiplierBp: 12_500,
  active: true,
};

describe('surge rule draft (T-4811)', () => {
  it('переводить хвилини у HH:MM і назад', () => {
    expect(minutesToTime(1080)).toBe('18:00');
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(null)).toBe('');
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(timeToMinutes('')).toBeNull();
    expect(timeToMinutes('25:00')).toBe(1500);
  });

  it('рядок правила стає чернеткою без втрати обмежень', () => {
    expect(toDraft(ROW)).toEqual({
      locationId: 'loc-1',
      dayOfWeek: '4',
      fromTime: '18:00',
      toTime: '21:00',
      seniorityTier: 'senior',
      multiplierPercent: '125',
    });
  });

  it('чернетка стає тілом PUT: порожні обмеження — null, множник у bp', () => {
    expect(toPayload(toDraft(ROW))).toEqual({
      locationId: 'loc-1',
      dayOfWeek: 4,
      fromMinute: 1080,
      toMinute: 1260,
      seniorityTier: 'senior',
      multiplierBp: 12_500,
    });
    expect(toPayload(EMPTY_DRAFT)).toEqual({
      locationId: null,
      dayOfWeek: null,
      fromMinute: null,
      toMinute: null,
      seniorityTier: null,
      multiplierBp: 12_500,
    });
  });

  it('порожня чернетка валідна (правило «завжди»)', () => {
    expect(draftError(EMPTY_DRAFT)).toBeNull();
  });

  it('множник нижче 100% або вище 500% блокує збереження', () => {
    expect(draftError({ ...EMPTY_DRAFT, multiplierPercent: '99' })).toMatch(/100–500%/);
    expect(draftError({ ...EMPTY_DRAFT, multiplierPercent: '501' })).toMatch(/100–500%/);
    expect(draftError({ ...EMPTY_DRAFT, multiplierPercent: '' })).toMatch(/100–500%/);
  });

  it('вікно — обидві межі разом і від < до', () => {
    expect(draftError({ ...EMPTY_DRAFT, fromTime: '18:00' })).toMatch(/обидві межі/);
    expect(draftError({ ...EMPTY_DRAFT, fromTime: '21:00', toTime: '18:00' })).toMatch(/від < до/);
    expect(draftError({ ...EMPTY_DRAFT, fromTime: '18:00', toTime: '21:00' })).toBeNull();
  });
});
