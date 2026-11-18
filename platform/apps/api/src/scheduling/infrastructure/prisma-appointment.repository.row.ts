// Мапінг рядка Booking → агрегат Appointment: restore для reconstitute,
// HH:mm для агрегатного часу, reason із останньої події cancelled.
import { Appointment, type AppointmentStatus } from '../domain/appointment.aggregate';

export interface BookingRow {
  id: string;
  locationId: string;
  barberId: string;
  start: Date;
  end: Date;
  appointmentId: string | null;
  status: string | null;
  cancelReason: string | null;
  haircutReferenceId: string | null;
  appointmentComment: string | null;
}

export function restoreAppointment(row: BookingRow): Appointment {
  return Appointment.reconstitute({
    id: row.appointmentId ?? row.id,
    bookingId: row.id,
    locationId: row.locationId,
    barberId: row.barberId,
    status: (row.status ?? 'booked') as AppointmentStatus,
    start: hhmm(row.start),
    end: hhmm(row.end),
    ...(row.cancelReason ? { cancelReason: row.cancelReason } : {}),
    haircutReferenceId: row.haircutReferenceId,
    appointmentComment: row.appointmentComment,
  });
}

function hhmm(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/** Причина скасування — з payload останньої події cancelled; інакше порожньо. */
export function cancelReasonOf(appointment: Appointment): string {
  return appointment.pullEvents().find((event) => event.type === 'scheduling.appointment.cancelled')
    ? String((appointment.pullEvents().at(-1)?.payload as { reason?: string }).reason ?? '')
    : '';
}
