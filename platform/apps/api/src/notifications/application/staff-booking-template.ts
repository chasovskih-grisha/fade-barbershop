import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { formatWhen, toLetterRows, whereLine } from './letter-fields';

export interface StaffBookingLetterData {
  locationName?: string;
  locationAddress?: string;
  barberName?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  start?: string;
  dashboardUrl?: string;
  brand?: string;
}

export function staffBookingLines(data: StaffBookingLetterData): [string, string][] {
  const lines: [string, string][] = [];
  const when = formatWhen(data.start);
  if (when) lines.push(['Коли', when]);
  const where = whereLine(data.locationName, data.locationAddress);
  if (where) lines.push(['Де', where]);
  if (data.barberName) lines.push(['Майстер', data.barberName]);
  if (data.clientName) lines.push(['Клієнт', data.clientName]);
  if (data.clientPhone) lines.push(['Телефон клієнта', data.clientPhone]);
  if (data.serviceName) lines.push(['Послуга', data.serviceName]);
  return lines;
}

function view(data: StaffBookingLetterData, brand: string): Record<string, unknown> {
  return {
    brand,
    serviceName: data.serviceName || 'Послуга',
    when: formatWhen(data.start),
    dashboardUrl: data.dashboardUrl || 'https://fade.barbershop/admin/schedule',
    rows: toLetterRows(staffBookingLines(data)),
  };
}

export function renderStaffBookingSubject(data: StaffBookingLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('staff-booking-notification', 'subject', view(data, brand));
}

export function renderStaffBookingText(data: StaffBookingLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('staff-booking-notification', 'text', view(data, brand));
}

export function renderStaffBookingHtml(data: StaffBookingLetterData, brand = 'FADE'): string {
  return renderEmailTemplate('staff-booking-notification', 'html', view(data, brand));
}
