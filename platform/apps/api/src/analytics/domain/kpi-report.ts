/** CSV export of executive KPI rows (T-5013). */

import type { ExecutiveKpis } from './executive-kpis';

const HEADER = [
  'dimension',
  'key',
  'revpar_minor',
  'utilisation_rate',
  'rebooking_rate',
  'churn_rate',
  'average_order_value_minor',
  'nps',
] as const;

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function row(kpis: ExecutiveKpis): string {
  return [
    kpis.dimension,
    kpis.key,
    kpis.revParMinor,
    kpis.utilisationRate,
    kpis.rebookingRate,
    kpis.churnRate,
    kpis.averageOrderValueMinor,
    kpis.nps,
  ]
    .map(cell)
    .join(',');
}

export function toKpiCsv(rows: readonly ExecutiveKpis[]): string {
  return [HEADER.join(','), ...rows.map(row)].join('\n');
}
