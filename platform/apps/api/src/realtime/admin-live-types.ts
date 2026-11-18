// Події outbox, цікаві «живому» оновленню адмінки (T-045): кожен крок
// життєвого циклу візиту змінює сітку календаря й цифри дашборда, тож клієнт
// має перечитати день. Перелік — єдине джерело правди для where.type.
export const ADMIN_LIVE_TYPES: readonly string[] = [
  'scheduling.appointment.booked',
  'scheduling.appointment.confirmed',
  'scheduling.appointment.started',
  'scheduling.appointment.rescheduled',
  'scheduling.appointment.cancelled',
  'scheduling.appointment.completed',
  'scheduling.appointment.no_showed',
  'scheduling.appointment.reference_changed',
];

/** Сповіщення клієнту: тип події + візит (payload клієнт не розбирає — лише
 * сигнал «перечитай екран», тож сюди не протікають персональні дані). */
export interface AdminLiveNotice {
  type: string;
  appointmentId: string;
}
