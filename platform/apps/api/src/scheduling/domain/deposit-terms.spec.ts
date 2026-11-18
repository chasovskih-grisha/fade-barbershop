// Умови депозиту (PAY-ADM-09): сума = % від ціни, округлення, вікно.
// null — грошей у візиті немає (вимкнено, нульова ціна, нуль після округлення).
import { DEFAULT_DEPOSIT_POLICY, depositTermsFor, freeCancelDeadline } from './deposit-terms';

describe('depositTermsFor', () => {
  it('за замовчуванням бере 30% і округлення 10 грн', () => {
    expect(depositTermsFor(700)).toEqual({
      amount: 210,
      percent: 30,
      rounding: 10,
      cancellationWindowHours: 4,
    });
  });

  it('округляє суму до кроку політики', () => {
    expect(depositTermsFor(333)?.amount).toBe(100); // 99.9 → 100
    expect(depositTermsFor(334)?.amount).toBe(100); // 100.2 → 100
  });

  it('не стягує більше за ціну візиту', () => {
    expect(depositTermsFor(700, { ...DEFAULT_DEPOSIT_POLICY, percent: 100 })?.amount).toBe(700);
  });

  it('вимкнена політика (0%) — депозиту немає', () => {
    expect(depositTermsFor(700, { ...DEFAULT_DEPOSIT_POLICY, percent: 0 })).toBeNull();
  });

  it('безкоштовний або невідомий візит — депозиту немає (PAY-003)', () => {
    expect(depositTermsFor(0)).toBeNull();
    expect(depositTermsFor(null)).toBeNull();
    expect(depositTermsFor(undefined)).toBeNull();
  });

  it('сума, що після округлення дорівнює нулю, — депозиту немає', () => {
    expect(depositTermsFor(10)).toBeNull(); // 3 грн → 0
  });

  it('вікно скасування затиснуте в 0–72 год', () => {
    expect(
      depositTermsFor(700, { ...DEFAULT_DEPOSIT_POLICY, cancellationWindowHours: -5 })
        ?.cancellationWindowHours
    ).toBe(0);
    expect(
      depositTermsFor(700, { ...DEFAULT_DEPOSIT_POLICY, cancellationWindowHours: 200 })
        ?.cancellationWindowHours
    ).toBe(72);
  });
});

describe('freeCancelDeadline', () => {
  it('віднімає вікно від початку візиту', () => {
    const start = new Date('2026-11-12T12:00:00.000Z');
    expect(freeCancelDeadline(start, 4).toISOString()).toBe('2026-11-12T08:00:00.000Z');
    expect(freeCancelDeadline(start, 0).toISOString()).toBe(start.toISOString());
  });
});
