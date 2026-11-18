import { formatPhoneInput, nationalDigits, phoneDigits, toE164 } from './phone';

describe('phone', () => {
  it('лишає тільки цифри', () => {
    expect(phoneDigits('+38 (067) 123-45-67')).toBe('380671234567');
  });

  it('нормалізує номер до національних 10 цифр', () => {
    expect(nationalDigits('+380671234567')).toBe('0671234567');
    expect(nationalDigits('380671234567')).toBe('0671234567');
    expect(nationalDigits('671234567')).toBe('0671234567');
    expect(nationalDigits('0671234567')).toBe('0671234567');
  });

  it('віддає E.164 лише для повного номера', () => {
    expect(toE164('0671234567')).toBe('+380671234567');
    expect(toE164('067123')).toBe('');
  });

  it('форматує повний номер за маскою', () => {
    expect(formatPhoneInput('+380671234567')).toBe('+38 (067) 123-45-67');
  });

  it('форматує номер у процесі введення', () => {
    expect(formatPhoneInput('0')).toBe('+38 (0');
    expect(formatPhoneInput('067')).toBe('+38 (067)');
    expect(formatPhoneInput('0671')).toBe('+38 (067) 1');
  });

  it('порожній ввід лишається порожнім', () => {
    expect(formatPhoneInput('')).toBe('');
    expect(formatPhoneInput('+38')).toBe('');
  });
});
