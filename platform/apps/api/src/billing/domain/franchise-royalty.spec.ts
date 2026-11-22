import {
  calculateRoyalty,
  summarizeNetwork,
  type FranchiseAgreement,
} from './franchise-royalty';

const agreement: FranchiseAgreement = {
  franchiseeId: 'franchisee-1',
  locationId: 'location-1',
  royaltyRate: 0.06,
  marketingFundRate: 0.02,
  minimumMonthlyFeeMinor: 50_000,
  currency: 'USD',
};

describe('calculateRoyalty (T-5030)', () => {
  it('assesses royalty and marketing fund on net revenue', () => {
    const statement = calculateRoyalty(agreement, {
      locationId: 'location-1',
      period: '2026-11',
      grossRevenueMinor: 2_000_000,
      refundsMinor: 100_000,
    });

    expect(statement.netRevenueMinor).toBe(1_900_000);
    expect(statement.royaltyMinor).toBe(114_000);
    expect(statement.marketingFundMinor).toBe(38_000);
    expect(statement.minimumTopUpMinor).toBe(0);
    expect(statement.totalDueMinor).toBe(152_000);
  });

  it('tops up to the contractual monthly minimum and never goes negative', () => {
    const statement = calculateRoyalty(agreement, {
      locationId: 'location-1',
      period: '2026-11',
      grossRevenueMinor: 200_000,
      refundsMinor: 500_000,
    });

    expect(statement.netRevenueMinor).toBe(0);
    expect(statement.totalDueMinor).toBe(50_000);
  });
});

describe('summarizeNetwork (T-5030)', () => {
  it('aggregates statements by currency for the franchisor ledger', () => {
    const usd = calculateRoyalty(agreement, {
      locationId: 'location-1',
      period: '2026-11',
      grossRevenueMinor: 1_000_000,
      refundsMinor: 0,
    });
    const uah = calculateRoyalty(
      { ...agreement, currency: 'UAH', locationId: 'location-2' },
      { locationId: 'location-2', period: '2026-11', grossRevenueMinor: 500_000, refundsMinor: 0 }
    );

    // The UAH shop falls below the 50 000 minimum fee, so the top-up applies.
    expect(summarizeNetwork([usd, uah])).toEqual({
      totalDueMinor: 80_000 + 50_000,
      byCurrency: { USD: 80_000, UAH: 50_000 },
    });
  });
});
