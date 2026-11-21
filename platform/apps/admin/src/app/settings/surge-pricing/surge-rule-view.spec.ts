// Підписи правила surge (T-4811): адмін читає область дії й множник, а не id.
import { multiplierLabel, ruleScope } from './surge-rule-view';

const ROW = {
  id: 'r1',
  locationId: null,
  dayOfWeek: null,
  fromMinute: null,
  toMinute: null,
  seniorityTier: null,
  multiplierBp: 12_500,
  active: true,
};

describe('surge rule view (T-4811)', () => {
  it('множник показується у разах без зайвих нулів', () => {
    expect(multiplierLabel(12_500)).toBe('×1.25');
    expect(multiplierLabel(11_000)).toBe('×1.1');
    expect(multiplierLabel(10_000)).toBe('×1');
  });

  it('правило без обмежень діє завжди', () => {
    expect(ruleScope(ROW)).toBe('Будь-який день · весь день · будь-який рівень');
  });

  it('день, вікно і рівень складаються в один рядок', () => {
    expect(
      ruleScope({ ...ROW, dayOfWeek: 4, fromMinute: 1080, toMinute: 1260, seniorityTier: 'senior' })
    ).toBe('Пт · 18:00–21:00 · senior');
  });
});
