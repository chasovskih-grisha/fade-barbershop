// Презентація стрічки підсумків (T-4606b): підписи, значення, формули й
// розподіли — чиста функція від DTO, тож тести читають цифри без рендера DOM.
// Формули — `docs/ubiquitous-language.md` (AvgTicket, NoShowRate) і §6.1.
import { formatMoney } from '@fade/ui';
import type { ClientListSummary } from './client-list-types';

export interface SummaryMetric {
  key: string;
  label: string;
  value: string;
  /** Формула показується в tooltip картки (T-111, ANL-ADM-02). */
  formula: string;
}

/** Частка 0..1 → відсотки без дробів: UI не показує «33.33%». */
export const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

/** ISO → DD.MM без таймзон (рядок не парсимо в Date — сервер віддає UTC). */
const shortDate = (iso: string): string =>
  iso.slice(0, 10).split('-').reverse().slice(0, 2).join('.');

/** Підпис вікна підсумків: «10.09 – 10.10» — видно, за що цифри. */
export const windowLabel = (summary: ClientListSummary): string =>
  `${shortDate(summary.from)} – ${shortDate(summary.to)}`;

/** KPI-картки стрічки: порядок — від «скільки клієнтів» до «як часто вертаються». */
export function summaryMetrics(summary: ClientListSummary): SummaryMetric[] {
  return [
    {
      key: 'total',
      label: 'Клієнтів у фільтрі',
      value: String(summary.total),
      formula: 'Клієнти, що відповідають поточним фільтрам (те саме число, що в таблиці)',
    },
    {
      key: 'newClients',
      label: 'Нові за період',
      value: String(summary.newClients),
      formula: 'Профілі, створені у вибраному вікні',
    },
    {
      key: 'visits',
      label: 'Візити за період',
      value: String(summary.visits),
      formula:
        'Усі записи цих клієнтів зі стартом у вікні — той самий лічильник, що в колонці «Візитів»',
    },
    {
      key: 'revenue',
      label: 'Сума за період',
      value: formatMoney(summary.revenue),
      formula: 'Σ AgreedPrice завершених візитів у вікні',
    },
    {
      key: 'avgTicket',
      label: 'Середній чек',
      value: formatMoney(summary.avgTicket),
      formula: 'AvgTicket = виручка / завершені візити',
    },
    {
      key: 'noShowRate',
      label: 'No-show',
      value: percent(summary.noShowRate),
      formula: 'NoShowRate = no-show візити / усі заброньовані за період',
    },
    {
      key: 'quiet',
      label: 'Тихі 90+',
      value: `${summary.quietClients} · ${percent(summary.quietShare)}`,
      formula: 'Без візиту 90+ днів; клієнту без візитів узагалі — відлік від реєстрації',
    },
    {
      key: 'repeatShare',
      label: 'Повторні',
      value: percent(summary.repeatShare),
      formula: 'Клієнти з двома і більше візитами за всі часи',
    },
  ];
}

/** Розподіл за прогресом лояльності (LYL-004…007: безкоштовний візит — на 6/7). */
export const loyaltyRows = (summary: ClientListSummary): { label: string; count: number }[] => [
  { label: 'Без візитів', count: summary.loyalty.none },
  { label: '1–5', count: summary.loyalty.progress },
  { label: '6 — безкоштовний', count: summary.loyalty.freeVisit },
  { label: '7+', count: summary.loyalty.cycle },
];

/** Розподіл за локацією останнього візиту; локації без візитів — окремо. */
export const locationRows = (
  summary: ClientListSummary,
  nameOf: (locationId: string) => string
): { label: string; count: number }[] => [
  ...summary.locations.byLocation.map((row) => ({
    label: nameOf(row.locationId),
    count: row.count,
  })),
  { label: 'Без візитів', count: summary.locations.noVisit },
];
