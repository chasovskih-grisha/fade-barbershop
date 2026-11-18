import { formatPhone, isCompleteUaPhone, toE164 } from './phoneFormat';

describe('phoneFormat', () => {
  it('збирає E.164 з маски, локального номера і порожнього префікса', () => {
    expect(formatPhone('+380')).toBe('+380');
    expect(toE164('+380')).toBe('+380');
    expect(isCompleteUaPhone('+380')).toBe(false);

    expect(formatPhone('0671234567')).toBe('+380 (67) 123-45-67');
    expect(toE164('0671234567')).toBe('+380671234567');
    expect(isCompleteUaPhone('0671234567')).toBe(true);
    expect(toE164(formatPhone('+380671234567').replace(/\D/g, ''))).toBe('+380671234567');
  });
});
