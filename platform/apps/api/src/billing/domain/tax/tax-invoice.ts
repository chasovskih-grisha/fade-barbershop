/** Localized tax invoice assembly (T-5004). */

import {
  calculateTax,
  type TaxJurisdiction,
  type TaxableLine,
  type TaxedLine,
} from './tax-jurisdiction';

export interface TaxInvoiceInput {
  readonly invoiceNumber: string;
  readonly issuedAt: Date;
  readonly currency: string;
  readonly jurisdiction: TaxJurisdiction;
  readonly customerName: string;
  readonly lines: readonly TaxableLine[];
}

export interface TaxInvoice {
  readonly invoiceNumber: string;
  readonly issuedAt: Date;
  readonly currency: string;
  readonly jurisdictionId: string;
  readonly customerName: string;
  readonly lines: readonly TaxedLine[];
  readonly subtotalMinor: number;
  readonly taxTotalMinor: number;
  readonly totalMinor: number;
}

/** Builds the data a PDF template needs; formatting stays in email-templates. */
export function buildTaxInvoice(input: TaxInvoiceInput): TaxInvoice {
  const total = calculateTax(input.lines, input.jurisdiction);
  return {
    invoiceNumber: input.invoiceNumber,
    issuedAt: input.issuedAt,
    currency: input.currency,
    jurisdictionId: input.jurisdiction.id,
    customerName: input.customerName,
    lines: total.lines,
    subtotalMinor: total.subtotalMinor,
    taxTotalMinor: total.taxTotalMinor,
    totalMinor: total.totalMinor,
  };
}
