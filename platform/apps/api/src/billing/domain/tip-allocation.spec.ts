import { allocateTips, splitPool, type TipContribution } from './tip-allocation';
import {
  buildTipPayoutEntries,
  planTipPayouts,
  reconcileTipPayouts,
  type TipPayoutEntry,
  type TipPayoutTransfer,
} from './tip-payout-ledger';

const shift: TipContribution[] = [
  { barberId: 'anna', amountMinor: 5_000, hoursWorked: 8, serviceRevenueMinor: 120_000 },
  { barberId: 'borys', amountMinor: 3_000, hoursWorked: 4, serviceRevenueMinor: 60_000 },
  { barberId: 'carla', amountMinor: 2_000, hoursWorked: 6, serviceRevenueMinor: 90_000 },
];

describe('tip allocation (T-5006)', () => {
  it('keeps tips with their earner under the individual rule', () => {
    expect(allocateTips(shift, { kind: 'individual' })).toEqual([
      { barberId: 'anna', amountMinor: 5_000 },
      { barberId: 'borys', amountMinor: 3_000 },
      { barberId: 'carla', amountMinor: 2_000 },
    ]);
  });

  it('pools by hours worked and keeps the exact total', () => {
    const allocations = allocateTips(shift, { kind: 'pooled', basis: 'hours' });
    expect(allocations).toEqual([
      { barberId: 'anna', amountMinor: 4_445 },
      { barberId: 'borys', amountMinor: 2_222 },
      { barberId: 'carla', amountMinor: 3_333 },
    ]);
    expect(allocations.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(10_000);
  });

  it('pools by service revenue and by equal shares', () => {
    expect(allocateTips(shift, { kind: 'pooled', basis: 'service_revenue' })).toEqual([
      { barberId: 'anna', amountMinor: 4_445 },
      { barberId: 'borys', amountMinor: 2_222 },
      { barberId: 'carla', amountMinor: 3_333 },
    ]);
    const equal = allocateTips(shift, { kind: 'pooled', basis: 'equal' });
    expect(equal.map((item) => item.amountMinor)).toEqual([3_334, 3_333, 3_333]);
  });

  it('splits a hybrid rule between the earner and the pool', () => {
    const allocations = allocateTips(shift, {
      kind: 'hybrid',
      basis: 'hours',
      pooledShare: 0.5,
    });
    expect(allocations.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(10_000);
    // Half of every tip stays with its earner; the other half pools by hours.
    expect(allocations).toEqual([
      { barberId: 'anna', amountMinor: 4_722 },
      { barberId: 'borys', amountMinor: 2_611 },
      { barberId: 'carla', amountMinor: 2_667 },
    ]);
  });

  it('falls back to an equal split when every weight is zero', () => {
    const flat: TipContribution[] = [
      { barberId: 'a', amountMinor: 1_000 },
      { barberId: 'b', amountMinor: 1_000 },
    ];
    expect(splitPool(1_001, flat, 'hours')).toEqual([
      { barberId: 'a', amountMinor: 501 },
      { barberId: 'b', amountMinor: 500 },
    ]);
  });
});

describe('tip payout ledger (T-5006)', () => {
  const entries = buildTipPayoutEntries(
    [
      { barberId: 'anna', amountMinor: 4_444 },
      { barberId: 'borys', amountMinor: 2_223 },
      { barberId: 'carla', amountMinor: 3_333 },
    ],
    '2026-11-W3',
    'UAH'
  );

  it('writes deterministic pending ledger entries', () => {
    expect(entries).toEqual([
      { id: 'tip-2026-11-W3-anna', barberId: 'anna', amountMinor: 4_444, currency: 'UAH', period: '2026-11-W3', status: 'pending' },
      { id: 'tip-2026-11-W3-borys', barberId: 'borys', amountMinor: 2_223, currency: 'UAH', period: '2026-11-W3', status: 'pending' },
      { id: 'tip-2026-11-W3-carla', barberId: 'carla', amountMinor: 3_333, currency: 'UAH', period: '2026-11-W3', status: 'pending' },
    ]);
  });

  it('batches per barber and carries over sub-threshold balances', () => {
    const plan = planTipPayouts(entries, 3_000);
    expect(plan.transfers.map((transfer) => [transfer.barberId, transfer.amountMinor])).toEqual([
      ['anna', 4_444],
      ['carla', 3_333],
    ]);
    expect(plan.carriedOver.map((entry) => entry.barberId)).toEqual(['borys']);
    expect(plan.totalMinor).toBe(7_777);
  });

  it('reconciles paid entries against transfers', () => {
    const paid: TipPayoutEntry[] = entries.map((entry) => ({ ...entry, status: 'paid' }));
    const transfers: TipPayoutTransfer[] = [
      { barberId: 'anna', amountMinor: 4_444, currency: 'UAH', entryIds: [paid[0]!.id] },
      { barberId: 'borys', amountMinor: 2_223, currency: 'UAH', entryIds: [paid[1]!.id] },
      { barberId: 'carla', amountMinor: 3_333, currency: 'UAH', entryIds: [paid[2]!.id] },
    ];
    expect(reconcileTipPayouts(paid, transfers)).toEqual({
      missingInLedger: [],
      missingInPayout: [],
      mismatched: [],
    });

    const broken = reconcileTipPayouts(paid, [
      { barberId: 'anna', amountMinor: 4_000, currency: 'UAH', entryIds: [paid[0]!.id] },
      { barberId: 'carla', amountMinor: 3_333, currency: 'UAH', entryIds: [paid[2]!.id, 'tip-unknown'] },
    ]);
    expect(broken.missingInLedger).toEqual(['tip-unknown']);
    expect(broken.missingInPayout).toEqual([paid[1]!.id]);
    expect(broken.mismatched).toEqual([
      { entryId: paid[0]!.id, ledgerMinor: 4_444, payoutMinor: 4_000 },
    ]);
  });

  it('ignores unpaid entries when planning payouts', () => {
    const mixed: TipPayoutEntry[] = entries.map((entry, index) => ({
      ...entry,
      status: index === 0 ? 'paid' : entry.status,
    }));
    const plan = planTipPayouts(mixed);
    expect(plan.transfers.map((transfer) => transfer.barberId)).toEqual(['borys', 'carla']);
  });
});
