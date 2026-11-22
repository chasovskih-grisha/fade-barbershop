import { calculateCommissions, computeTieredCommission, splitTeamCommission } from './commission-calculator';
import { buildPayrollReport, toPayrollCsv } from './commission-payroll';
import type { CommissionRateCard, SaleLine } from './commission.types';

const rateCard: CommissionRateCard = {
  byReference: {
    'svc-fade': { id: 'fade-flat', kind: 'flat', rate: 0.4 },
    'svc-cut': {
      id: 'cut-tiered',
      kind: 'tiered',
      tiers: [
        { upToMinor: 50_000, rate: 0.35 },
        { upToMinor: null, rate: 0.45 },
      ],
    },
    'prod-pomade': { id: 'pomade-kickback', kind: 'retail_kickback', fixedMinor: 5_000 },
  },
  byKind: {
    service: { id: 'default-service', kind: 'flat', rate: 0.3 },
    product: { id: 'default-product', kind: 'flat', rate: 0.1 },
  },
};

function line(overrides: Partial<SaleLine> & { id: string }): SaleLine {
  return {
    kind: 'service',
    barberId: 'barber-1',
    referenceId: 'svc-fade',
    listAmountMinor: 40_000,
    ...overrides,
  };
}

describe('commission calculation (T-5022)', () => {
  it('pays progressive tiers on the portion inside each band', () => {
    const rule = rateCard.byReference['svc-cut'];
    const tiers = rule?.kind === 'tiered' ? rule.tiers : [];
    expect(computeTieredCommission(70_000, tiers)).toBe(26_500);
  });

  it('uses the most specific rule and falls back to the line kind', () => {
    const entries = calculateCommissions(rateCard, [
      line({ id: 'l1' }),
      line({ id: 'l2', referenceId: 'svc-cut', listAmountMinor: 70_000 }),
      line({ id: 'l3', kind: 'product', referenceId: 'prod-pomade', listAmountMinor: 20_000 }),
      line({ id: 'l4', kind: 'product', referenceId: 'unknown-product', listAmountMinor: 20_000 }),
      line({ id: 'l5', barberId: 'barber-2', referenceId: 'svc-unknown', listAmountMinor: 10_000 }),
    ]);
    expect(entries.map((entry) => [entry.ruleId, entry.commissionMinor])).toEqual([
      ['fade-flat', 16_000],
      ['cut-tiered', 26_500],
      ['pomade-kickback', 5_000],
      ['default-product', 2_000],
      ['default-service', 3_000],
    ]);
  });

  it('splits team commission by weight and keeps the exact total', () => {
    const split = splitTeamCommission(10_000, [
      { barberId: 'a', weight: 2 },
      { barberId: 'b', weight: 1 },
    ]);
    expect(split).toEqual([
      { barberId: 'a', amountMinor: 6_667 },
      { barberId: 'b', amountMinor: 3_333 },
    ]);
    expect(splitTeamCommission(0, [{ barberId: 'a', weight: 1 }])).toEqual([
      { barberId: 'a', amountMinor: 0 },
    ]);
    expect(splitTeamCommission(100, [{ barberId: 'a', weight: 0 }])).toEqual([
      { barberId: 'a', amountMinor: 0 },
    ]);
  });
});

describe('payroll export (T-5022)', () => {
  it('aggregates service/product revenue and commission per barber', () => {
    const lines = [
      line({ id: 'l1', listAmountMinor: 40_000 }),
      line({ id: 'l2', kind: 'product', referenceId: 'prod-pomade', listAmountMinor: 20_000 }),
      line({ id: 'l3', barberId: 'barber-2', referenceId: 'svc-unknown', listAmountMinor: 10_000 }),
    ];
    const entries = calculateCommissions(rateCard, lines);
    const report = buildPayrollReport(entries, '2026-11', lines);

    expect(report).toEqual([
      { barberId: 'barber-1', period: '2026-11', serviceRevenueMinor: 40_000, productRevenueMinor: 20_000, commissionMinor: 21_000 },
      { barberId: 'barber-2', period: '2026-11', serviceRevenueMinor: 10_000, productRevenueMinor: 0, commissionMinor: 3_000 },
    ]);
    const csv = toPayrollCsv(report);
    expect(csv.split('\n')[0]).toBe(
      'barber_id,period,service_revenue_minor,product_revenue_minor,commission_minor'
    );
    expect(csv.split('\n')[1]).toBe('barber-1,2026-11,40000,20000,21000');
  });
});
