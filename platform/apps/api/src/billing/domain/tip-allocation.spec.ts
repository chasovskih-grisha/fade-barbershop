import { allocateTips, splitPool, type TipContribution } from './tip-allocation';

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
