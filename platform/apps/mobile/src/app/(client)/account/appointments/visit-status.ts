import { tokens } from '@fade/design-tokens';
import type { CabinetStatus } from '../../../../lib/booking-contract';

// Слова кабінету сайту для тих самих статусів (T-4739a, docs/client-screens.md §4).
// Колір — токен теми застосунку, не hex-літерал і не `accent.blue` як заливка.
const COLOR = tokens.color;

export const VISIT_STATUS: Record<CabinetStatus, { label: string; color: string }> = {
  upcoming: { label: 'Очікується', color: COLOR.semantic.info.value },
  confirmed: { label: 'Підтверджено', color: COLOR.semantic.success.value },
  completed: { label: 'Завершено', color: COLOR.text.secondary.value },
  cancelled: { label: 'Скасовано', color: COLOR.text.dangerText.value },
};

/** Слово і колір бейджа для статусу візиту; невідомий статус лишається як є. */
export function visitStatusBadge(status: CabinetStatus): { label: string; color: string } {
  return VISIT_STATUS[status] ?? { label: status, color: COLOR.text.muted.value };
}
