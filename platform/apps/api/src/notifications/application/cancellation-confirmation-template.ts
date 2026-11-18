import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { formatWhen, toLetterRows, whereLine } from './letter-fields';

export interface CancellationLetterData {
  locationName?: string;
  locationAddress?: string;
  barberName?: string;
  serviceName?: string;
  start?: string;
  cancellationReason?: string;
  brand?: string;
}

export function cancellationLines(data: CancellationLetterData): [string, string][] {
  const lines: [string, string][] = [];
  const when = formatWhen(data.start);
  if (when) lines.push(['Коли', when]);
  const where = whereLine(data.locationName, data.locationAddress);
  if (where) lines.push(['Де', where]);
  if (data.barberName) lines.push(['Майстер', data.barberName]);
  if (data.serviceName) lines.push(['Послуга', data.serviceName]);
  if (data.cancellationReason) lines.push(['Причина', data.cancellationReason]);
  return lines;
}

function view(data: CancellationLetterData, brand: string): Record<string, unknown> {
  return { brand, when: formatWhen(data.start), rows: toLetterRows(cancellationLines(data)) };
}

export function renderCancellationSubject(data: CancellationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('cancellation-confirmation', 'subject', view(data, brand));
}

export function renderCancellationText(data: CancellationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('cancellation-confirmation', 'text', view(data, brand));
}

export function renderCancellationHtml(data: CancellationLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('cancellation-confirmation', 'html', view(data, brand));
}
