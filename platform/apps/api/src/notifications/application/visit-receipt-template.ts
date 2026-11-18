import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { toLetterRows } from './letter-fields';

export interface VisitReceiptData {
  locationName?: string;
  serviceName?: string;
  barberName?: string;
  amountPaid?: string;
  start?: string;
  brand?: string;
}

function receiptRows(data: VisitReceiptData): [string, string][] {
  const rows: [string, string][] = [];
  if (data.locationName) rows.push(['Де', data.locationName]);
  if (data.serviceName) rows.push(['Послуга', data.serviceName]);
  if (data.barberName) rows.push(['Майстер', data.barberName]);
  if (data.start) rows.push(['Коли', data.start]);
  return rows;
}

function view(data: VisitReceiptData, brand: string): Record<string, unknown> {
  return {
    brand,
    amount: data.amountPaid ?? '',
    rows: toLetterRows(receiptRows(data)),
  };
}

export function renderReceiptSubject(data: VisitReceiptData, brand = 'FADE'): string {
  return renderEmailTemplate('visit-receipt', 'subject', view(data, brand));
}

export function renderReceiptText(data: VisitReceiptData, brand = 'FADE'): string {
  return renderEmailTemplate('visit-receipt', 'text', view(data, brand));
}

export function renderReceiptHtml(data: VisitReceiptData, brand = 'FADE'): string {
  return renderEmailTemplate('visit-receipt', 'html', view(data, brand));
}
