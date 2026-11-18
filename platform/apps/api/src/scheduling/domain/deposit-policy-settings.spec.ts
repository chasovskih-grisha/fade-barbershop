// Політика депозиту як налаштування (PAY-ADM-09): дефолти, затискання
// діапазонів і кроки округлення. Зіпсований JSON не має ламати запис.
import { DEFAULT_DEPOSIT_POLICY, depositTermsFor } from './deposit-terms';
import {
  DEPOSIT_POLICY_SETTING_KEY,
  parseDepositPolicySettings,
  parsePolicyVersion,
  sameDepositPolicy,
} from './deposit-policy-settings';

describe('parseDepositPolicySettings', () => {
  it('без значення віддає дефолти PAY-ADM-09', () => {
    expect(parseDepositPolicySettings(null)).toEqual(DEFAULT_DEPOSIT_POLICY);
    expect(parseDepositPolicySettings('garbage')).toEqual(DEFAULT_DEPOSIT_POLICY);
    expect(parseDepositPolicySettings({})).toEqual(DEFAULT_DEPOSIT_POLICY);
  });

  it('читає збережену політику', () => {
    expect(
      parseDepositPolicySettings({ percent: 50, rounding: 5, cancellationWindowHours: 2 })
    ).toEqual({ percent: 50, rounding: 5, cancellationWindowHours: 2 });
  });

  it('нульовий відсоток — вимкнений депозит, а не дефолт', () => {
    const policy = parseDepositPolicySettings({ percent: 0 });
    expect(policy.percent).toBe(0);
    expect(depositTermsFor(700, policy)).toBeNull();
  });

  it('затискає відсоток і вікно в діапазони PAY-ADM-09', () => {
    expect(parseDepositPolicySettings({ percent: 250 }).percent).toBe(100);
    expect(parseDepositPolicySettings({ percent: -10 }).percent).toBe(0);
    expect(
      parseDepositPolicySettings({ cancellationWindowHours: 200 }).cancellationWindowHours
    ).toBe(72);
    expect(
      parseDepositPolicySettings({ cancellationWindowHours: -5 }).cancellationWindowHours
    ).toBe(0);
  });

  it('невідомий крок округлення не потрапляє в політику', () => {
    expect(parseDepositPolicySettings({ rounding: 3 }).rounding).toBe(10);
    expect(parseDepositPolicySettings({ rounding: 1 }).rounding).toBe(1);
  });

  it('ключ налаштування стабільний — на нього спирається адмін-ендпоінт', () => {
    expect(DEPOSIT_POLICY_SETTING_KEY).toBe('billing.depositPolicy');
  });

  it('версія з JSON: ціле ≥1, інакше 1', () => {
    expect(parsePolicyVersion({ version: 4 })).toBe(4);
    expect(parsePolicyVersion({ version: 2.8 })).toBe(2);
    expect(parsePolicyVersion({ version: 0 })).toBe(1);
    expect(parsePolicyVersion({})).toBe(1);
    expect(parsePolicyVersion(null)).toBe(1);
  });

  it('sameDepositPolicy бачить лише грошові правила, не версію', () => {
    expect(sameDepositPolicy(DEFAULT_DEPOSIT_POLICY, { ...DEFAULT_DEPOSIT_POLICY })).toBe(true);
    expect(
      sameDepositPolicy(DEFAULT_DEPOSIT_POLICY, { ...DEFAULT_DEPOSIT_POLICY, percent: 40 })
    ).toBe(false);
    expect(
      sameDepositPolicy(DEFAULT_DEPOSIT_POLICY, {
        ...DEFAULT_DEPOSIT_POLICY,
        cancellationWindowHours: 2,
      })
    ).toBe(false);
  });
});
