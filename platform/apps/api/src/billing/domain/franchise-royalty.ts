/** Franchise royalty and brand-fund accounting (T-5030). */

export interface FranchiseAgreement {
  readonly franchiseeId: string;
  readonly locationId: string;
  /** Share of net revenue paid as royalty, e.g. 0.06 for 6%. */
  readonly royaltyRate: number;
  /** Share of net revenue paid into the brand marketing fund. */
  readonly marketingFundRate: number;
  /** Floor for royalty + marketing fund combined, per month. */
  readonly minimumMonthlyFeeMinor: number;
  readonly currency: string;
}

export interface LocationRevenue {
  readonly locationId: string;
  readonly period: string;
  readonly grossRevenueMinor: number;
  readonly refundsMinor: number;
}

export interface RoyaltyStatement {
  readonly franchiseeId: string;
  readonly locationId: string;
  readonly period: string;
  readonly currency: string;
  readonly netRevenueMinor: number;
  readonly royaltyMinor: number;
  readonly marketingFundMinor: number;
  readonly minimumTopUpMinor: number;
  readonly totalDueMinor: number;
}

export function calculateRoyalty(
  agreement: FranchiseAgreement,
  revenue: LocationRevenue
): RoyaltyStatement {
  const netRevenueMinor = Math.max(
    0,
    revenue.grossRevenueMinor - Math.max(0, revenue.refundsMinor)
  );
  const royaltyMinor = Math.round(netRevenueMinor * agreement.royaltyRate);
  const marketingFundMinor = Math.round(netRevenueMinor * agreement.marketingFundRate);
  const assessed = royaltyMinor + marketingFundMinor;
  const minimumTopUpMinor = Math.max(0, agreement.minimumMonthlyFeeMinor - assessed);
  return {
    franchiseeId: agreement.franchiseeId,
    locationId: revenue.locationId,
    period: revenue.period,
    currency: agreement.currency,
    netRevenueMinor,
    royaltyMinor,
    marketingFundMinor,
    minimumTopUpMinor,
    totalDueMinor: assessed + minimumTopUpMinor,
  };
}

/** Network totals for the month-end franchisor statement, split by currency. */
export function summarizeNetwork(
  statements: readonly RoyaltyStatement[]
): { readonly totalDueMinor: number; readonly byCurrency: Readonly<Record<string, number>> } {
  const byCurrency: Record<string, number> = {};
  for (const statement of statements) {
    byCurrency[statement.currency] =
      (byCurrency[statement.currency] ?? 0) + statement.totalDueMinor;
  }
  return {
    totalDueMinor: statements.reduce((sum, statement) => sum + statement.totalDueMinor, 0),
    byCurrency,
  };
}
