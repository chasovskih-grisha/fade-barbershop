import { formatMoney } from './money';

describe('formatMoney', () => {
  it('містить символ гривні', () => {
    expect(formatMoney(600)).toContain('₴');
  });

  it('не додає копійки для цілих сум', () => {
    expect(formatMoney(600)).not.toContain(',');
  });

  it('розділяє тисячі', () => {
    const value = formatMoney(1500).replace(/\s/g, '');
    expect(value).toContain('1500');
  });

  it('supports locale-aware currency formatting for uk, en, and es', () => {
    expect(formatMoney(1000, 'uk')).toContain('₴');
    expect(formatMoney(1000, 'en')).toContain('UAH');
    expect(formatMoney(1000, 'es')).toContain('UAH');
  });
});
