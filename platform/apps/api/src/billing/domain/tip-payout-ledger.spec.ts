import {
  buildTipPayoutEntries,
  planTipPayouts,
  reconcileTipPayouts,
  type TipPayoutEntry,
  type TipPayoutTransfer,
} from './tip-payout-ledger';

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
      {
        barberId: 'carla',
        amountMinor: 3_333,
        currency: 'UAH',
        entryIds: [paid[2]!.id, 'tip-unknown'],
      },
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
