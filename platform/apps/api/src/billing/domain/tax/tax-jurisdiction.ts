/** Jurisdiction tax rules: EU VAT, US state sales tax and municipal add-ons (T-5004). */

export type TaxKind = 'vat' | 'sales_tax' | 'municipal';

export interface TaxRule {
  readonly id: string;
  readonly kind: TaxKind;
  readonly rate: number;
  /** Service/product categories this rule applies to; absent = everything. */
  readonly appliesTo?: readonly string[];
}

export interface TaxJurisdiction {
  readonly id: string;
  readonly country: string;
  readonly region?: string;
  readonly rules: readonly TaxRule[];
  /** EU-style gross pricing: listed prices already contain tax. */
  readonly pricesIncludeTax: boolean;
}

export interface TaxableLine {
  readonly id: string;
  readonly category: string;
  readonly amountMinor: number;
}

export interface TaxBreakdown {
  readonly ruleId: string;
  readonly kind: TaxKind;
  readonly rate: number;
  readonly amountMinor: number;
}

export interface TaxedLine {
  readonly lineId: string;
  readonly taxableMinor: number;
  readonly taxMinor: number;
  readonly totalMinor: number;
  readonly breakdown: readonly TaxBreakdown[];
}

export interface TaxTotal {
  readonly lines: readonly TaxedLine[];
  readonly subtotalMinor: number;
  readonly taxTotalMinor: number;
  readonly totalMinor: number;
}

function applicableRules(
  jurisdiction: TaxJurisdiction,
  category: string
): readonly TaxRule[] {
  return jurisdiction.rules.filter(
    (rule) => !rule.appliesTo || rule.appliesTo.includes(category)
  );
}

export function taxRateFor(jurisdiction: TaxJurisdiction, category: string): number {
  return applicableRules(jurisdiction, category).reduce(
    (sum, rule) => sum + rule.rate,
    0
  );
}

export function calculateLineTax(
  line: TaxableLine,
  jurisdiction: TaxJurisdiction
): TaxedLine {
  const rules = applicableRules(jurisdiction, line.category);
  const rate = rules.reduce((sum, rule) => sum + rule.rate, 0);
  const gross = line.amountMinor;
  const taxable = jurisdiction.pricesIncludeTax
    ? Math.round(gross / (1 + rate))
    : gross;
  const tax = jurisdiction.pricesIncludeTax ? gross - taxable : Math.round(gross * rate);
  const breakdown = rules.map((rule) => ({
    ruleId: rule.id,
    kind: rule.kind,
    rate: rule.rate,
    amountMinor: Math.round(taxable * rule.rate),
  }));
  return { lineId: line.id, taxableMinor: taxable, taxMinor: tax, totalMinor: taxable + tax, breakdown };
}

export function calculateTax(
  lines: readonly TaxableLine[],
  jurisdiction: TaxJurisdiction
): TaxTotal {
  const taxed = lines.map((line) => calculateLineTax(line, jurisdiction));
  return {
    lines: taxed,
    subtotalMinor: taxed.reduce((sum, line) => sum + line.taxableMinor, 0),
    taxTotalMinor: taxed.reduce((sum, line) => sum + line.taxMinor, 0),
    totalMinor: taxed.reduce((sum, line) => sum + line.totalMinor, 0),
  };
}
