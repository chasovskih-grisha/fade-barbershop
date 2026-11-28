// Мапер рядка візиту в read-модель «Мої візити» (web-cabinet-screens §3):
// відокремлено від запиту, кожна група полів — окремий маленький будівник.
import { kyivStamp } from './kyiv-stamp';
import type { AppointmentNames } from './client-appointment-names';
import { toClientDeposit } from './client-appointment-deposit';
import {
  CABINET_STATUS,
  type BookingRow,
  type ClientAppointmentView,
} from './client-appointments.view';

export interface RowSources {
  row: BookingRow;
  names: AppointmentNames;
  hold?: { expiresAt: Date; status: string };
  refund?: { status: string; amount: number | null };
}

/** Коли візит: локальний час (Київ) і ISO-моменти для календарних посилань (T-4446). */
function timingOf(row: BookingRow) {
  const stamp = kyivStamp(row.start);
  return {
    date: stamp.date,
    startTime: stamp.time,
    endTime: kyivStamp(row.end).time,
    startsAt: row.start.toISOString(),
    endsAt: row.end.toISOString(),
  };
}

/** Імена послуги, барбера й локації; відсутній запис довідника — порожній рядок. */
function namesOf(row: BookingRow, names: AppointmentNames) {
  return {
    serviceName: names.service.get(row.serviceId ?? '') ?? '',
    barberName: names.barber.get(row.barberId) ?? '',
    locationName: names.location.get(row.locationId) ?? '',
  };
}

/** Тільки ID: фото лежить у приватному бакеті (ADR 0008 §2), підписаний URL
 * клієнт отримує з GET /booking/reference-photos/:id (REF-WEB-03). */
function referenceOf(row: BookingRow) {
  return {
    referenceId: row.haircutReferenceId,
    referenceComment: row.appointmentComment ?? '',
  };
}

export function toClientAppointmentView(input: RowSources): ClientAppointmentView {
  const { row, names, hold, refund } = input;
  const domainStatus = row.status ?? 'booked';
  return {
    id: row.appointmentId ?? row.id,
    ...timingOf(row),
    ...namesOf(row, names),
    price: row.agreedPrice ?? 0,
    status: CABINET_STATUS[domainStatus] ?? 'upcoming',
    // ANL-004: рядки без каналу — старі онлайн-записи, не «без джерела».
    source: row.source ?? 'web',
    ...referenceOf(row),
    canEditReference: domainStatus === 'booked',
    canBookAgain: row.partyId === null,
    // T-4616a: причина скасування приходить із рядка візиту, а не з UI.
    cancelReason: row.cancelReason ?? null,
    // Депозит із снепшота візиту (PAY-ADM-09); діалог скасування читає лише його.
    deposit: toClientDeposit(row, hold, refund),
  };
}
