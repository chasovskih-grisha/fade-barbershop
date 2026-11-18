import { PhoneNumber } from './phone-number';

describe('PhoneNumber', () => {
  it('normalizes +380 Україна', () => {
    expect(PhoneNumber.of('+380501234567').value).toBe('+380501234567');
    expect(PhoneNumber.of('+38 050 123 45 67').value).toBe('+380501234567');
    expect(PhoneNumber.of('380501234567').value).toBe('+380501234567');
    expect(PhoneNumber.of('0 50 123 45 67').value).toBe('+380501234567');
  });

  it('rejects не-українські та невалідні номери', () => {
    expect(() => PhoneNumber.of('+12025550123')).toThrow();
    expect(() => PhoneNumber.of('050123456')).toThrow();
    expect(() => PhoneNumber.of('')).toThrow();
    expect(() => PhoneNumber.of('+38050123456')).toThrow();
  });
});
