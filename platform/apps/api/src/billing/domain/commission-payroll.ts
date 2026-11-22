/** Barber payroll aggregation and accounting CSV export (T-5022). */

import type { CommissionEntry } from './commission-calculator';
import type { SaleLine } from './commission.types';

export interface PayrollRow {
  readonly barberId: string;
  readonly period: string;
  readonly serviceRevenueMinor: number;
  readonly productRevenueMinor: number;
  readonly commissionMinor: number;
}

/** Aggregates commission ledger entries per barber for one payroll period. */
export function buildPayrollReport(
  entries: readonly CommissionEntry[],
  period: string,
  lines: readonly SaleLine[]
): PayrollRow[] {
  const linesById = new Map(lines.map((line) => [line.id, line]));
  const rows = new Map<string, PayrollRow>();
  for (const entry of entries) {
    const line = linesById.get(entry.lineId);
    const current = rows.get(entry.barberId) ?? {
      barberId: entry.barberId,
      period,
      serviceRevenueMinor: 0,
      productRevenueMinor: 0,
      commissionMinor: 0,
    };
    rows.set(entry.barberId, {
      ...current,
      serviceRevenueMinor:
        current.serviceRevenueMinor + (line?.kind === 'service' ? line.listAmountMinor : 0),
      productRevenueMinor:
        current.productRevenueMinor + (line?.kind === 'product' ? line.listAmountMinor : 0),
      commissionMinor: current.commissionMinor + entry.commissionMinor,
    });
  }
  return [...rows.values()].sort((left, right) => left.barberId.localeCompare(right.barberId));
}

const HEADER = [
  'barber_id',
  'period',
  'service_revenue_minor',
  'product_revenue_minor',
  'commission_minor',
] as const;

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** QuickBooks/Xero-importable payroll CSV. */
export function toPayrollCsv(rows: readonly PayrollRow[]): string {
  const body = rows.map((row) =>
    [row.barberId, row.period, row.serviceRevenueMinor, row.productRevenueMinor, row.commissionMinor]
      .map(cell)
      .join(',')
  );
  return [HEADER.join(','), ...body].join('\n');
}
