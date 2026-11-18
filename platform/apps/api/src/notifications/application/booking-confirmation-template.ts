// Лист підтвердження: які рядки показати — тут, формулювання — у
// templates/booking-confirmation. Час — Europe/Kyiv (ADR 0001).
import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { formatWhen, toLetterRows, whereLine } from './letter-fields';

export { formatWhen };

export interface ConfirmationLetterData {
  /** Ім'я локації («Де»); порожнє — рядок не рендериться. */
  locationName?: string;
  /** Адреса локації (другий рядок «Де»); опційно. */
  locationAddress?: string;
  /** Ім'я барбера; порожнє — рядок не рендериться. */
  barberName?: string;
  /** Назва послуги; порожнє — рядок не рендериться. */
  serviceName?: string;
  /** ISO-момент початку візиту. */
  start?: string;
  /** Бренд-підпис листа. */
  brand?: string;
}

export function confirmationLines(data: ConfirmationLetterData): [string, string][] {
  const lines: [string, string][] = [];
  const when = formatWhen(data.start);
  if (when) lines.push(['Коли', when]);
  const where = whereLine(data.locationName, data.locationAddress);
  if (where) lines.push(['Де', where]);
  if (data.barberName) lines.push(['Майстер', data.barberName]);
  if (data.serviceName) lines.push(['Послуга', data.serviceName]);
  return lines;
}

function view(data: ConfirmationLetterData, brand: string): Record<string, unknown> {
  return { brand, when: formatWhen(data.start), rows: toLetterRows(confirmationLines(data)) };
}

export function renderConfirmationSubject(data: ConfirmationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('booking-confirmation', 'subject', view(data, brand));
}

export function renderConfirmationText(data: ConfirmationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('booking-confirmation', 'text', view(data, brand));
}

export function renderConfirmationHtml(data: ConfirmationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('booking-confirmation', 'html', view(data, brand));
}
