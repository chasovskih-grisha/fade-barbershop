// Передзаповнення флоу за наміром повторного запису (T-4617b): перший крок,
// який ще треба обрати. Валідний параметр — крок пройдено; барбер
// необов'язковий («Будь-який» — дефолт), тож окремого кроку не додає.
import { prefillStep } from '../useBookAgainPrefill';

describe('prefillStep (T-4617b)', () => {
  it('starts at the location step without a location', () => {
    expect(prefillStep(false, false)).toBe(0);
  });

  it('opens the service step when only the location is valid', () => {
    expect(prefillStep(true, false)).toBe(1);
  });

  it('skips straight to the slot step when location and service are valid', () => {
    expect(prefillStep(true, true)).toBe(3);
  });
});
