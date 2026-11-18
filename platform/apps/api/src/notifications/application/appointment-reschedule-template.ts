import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { formatWhen, httpUrl, toLetterRows, whereLine } from './letter-fields';

export interface AppointmentRescheduleData {
  clientName?: string;
  locationName?: string;
  locationAddress?: string;
  barberName?: string;
  serviceName?: string;
  oldStart?: string;
  newStart?: string;
  manageUrl?: string;
  brand?: string;
}

export function appointmentRescheduleLines(data: AppointmentRescheduleData): [string, string][] {
  const lines: [string, string][] = [];
  const oldWhen = formatWhen(data.oldStart);
  const newWhen = formatWhen(data.newStart);
  if (oldWhen) lines.push(['Попередній час', oldWhen]);
  if (newWhen) lines.push(['Новий час', newWhen]);
  const where = whereLine(data.locationName, data.locationAddress);
  if (where) lines.push(['Де', where]);
  if (data.barberName) lines.push(['Майстер', data.barberName]);
  if (data.serviceName) lines.push(['Послуга', data.serviceName]);
  return lines;
}

function view(data: AppointmentRescheduleData, brand: string): Record<string, unknown> {
  return {
    brand,
    clientName: data.clientName ?? '',
    when: formatWhen(data.newStart),
    rows: toLetterRows(appointmentRescheduleLines(data)),
    manageUrl: httpUrl(data.manageUrl),
  };
}

export function renderAppointmentRescheduleSubject(
  data: AppointmentRescheduleData,
  brand = 'FADE'
): string {
  return renderEmailTemplate('appointment-reschedule', 'subject', view(data, brand));
}

export function renderAppointmentRescheduleText(
  data: AppointmentRescheduleData,
  brand = 'FADE'
): string {
  return renderEmailTemplate('appointment-reschedule', 'text', view(data, brand));
}

export function renderAppointmentRescheduleHtml(
  data: AppointmentRescheduleData,
  brand = 'FADE'
): string {
  return renderEmailTemplate('appointment-reschedule', 'html', view(data, brand));
}
