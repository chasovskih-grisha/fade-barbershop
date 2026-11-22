import { attributeBundle, type SaleLine } from './commission.types';

function line(overrides: Partial<SaleLine> & { id: string }): SaleLine {
  return {
    kind: 'service',
    barberId: 'barber-1',
    referenceId: 'svc-fade',
    listAmountMinor: 40_000,
    ...overrides,
  };
}

describe('attributeBundle (T-5022)', () => {
  it('attributes a bundle price proportionally with exact remainder distribution', () => {
    const attributed = attributeBundle(
      [
        line({ id: 'l1', listAmountMinor: 30_000 }),
        line({ id: 'l2', kind: 'product', listAmountMinor: 10_000 }),
        line({ id: 'l3', kind: 'product', listAmountMinor: 10_000 }),
      ],
      45_000
    );
    expect(attributed).toEqual([
      { lineId: 'l1', attributedMinor: 27_000 },
      { lineId: 'l2', attributedMinor: 9_000 },
      { lineId: 'l3', attributedMinor: 9_000 },
    ]);
    expect(attributed.reduce((sum, share) => sum + share.attributedMinor, 0)).toBe(45_000);
  });

  it('handles zero-priced lines without losing the bundle total', () => {
    const attributed = attributeBundle([line({ id: 'l1' })], 33_333);
    expect(attributed).toEqual([{ lineId: 'l1', attributedMinor: 33_333 }]);
    expect(attributeBundle([line({ id: 'z', listAmountMinor: 0 })], 1_000)).toEqual([
      { lineId: 'z', attributedMinor: 0 },
    ]);
  });

  it('splits remainder cents deterministically by largest remainder', () => {
    const attributed = attributeBundle(
      [
        line({ id: 'a', listAmountMinor: 1 }),
        line({ id: 'b', listAmountMinor: 1 }),
        line({ id: 'c', listAmountMinor: 1 }),
      ],
      100
    );
    expect(attributed.map((share) => share.attributedMinor)).toEqual([34, 33, 33]);
  });
});
