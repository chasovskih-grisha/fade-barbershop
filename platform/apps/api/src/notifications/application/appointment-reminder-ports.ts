// Порти нагадування про візит (T-080). Виділено з обох споживачів за
// LOC-гейтом; контракт — подієвий контур «подія візиту → відкладена рядок
// outbox → доставка», ідемпотентність — журнал NotificationRecord.
import type { NotificationJournal } from './booking-confirmation-ports';
import type { AppointmentReminderSettingsPort } from '../domain/appointment-reminder-settings';

/** Події візиту, з яких планується нагадування (іменовані — без [0]!). */
export const REMINDER_TRIGGER_BOOKED = 'scheduling.appointment.booked';
export const REMINDER_TRIGGER_RESCHEDULED = 'scheduling.appointment.rescheduled';
export const REMINDER_TRIGGER_TYPES: readonly string[] = [
  REMINDER_TRIGGER_BOOKED,
  REMINDER_TRIGGER_RESCHEDULED,
];

/** Відкладена подія самого нагадування (пише споживач- planner). */
export const REMINDER_DUE_EVENT_TYPE = 'notification.reminder.due';

/** Payload відкладеного нагадування: час спрацювання + дані візиту. */
export interface ReminderDuePayload {
  appointmentId: string;
  /** ISO-момент, коли нагадування має настати (start − leadMinutes). */
  fireAt: string;
  /** ISO-початок візиту; нагадування SMS рендерить саме його. */
  start?: string;
  locationId?: string;
  serviceId?: string;
}

/** Запис відкладеної події в outbox + скасування застарілих. */
export interface ReminderSchedule {
  /** Кладе рядок reminder.due з часом спрацювання fireAt. */
  schedule(input: {
    appointmentId: string;
    fireAt: Date;
    payload: ReminderDuePayload;
  }): Promise<void>;
  /** Закриває ще не спрацьовані нагадування візиту (перенесення часу);
   *  повертає кількість скасованих рядків. */
  cancelPending(appointmentId: string): Promise<number>;
}

/** Результат обробки однієї події (патерн HandleOutcome T-4608). */
export interface ReminderScheduleOutcome {
  handled: boolean;
  reason: 'sent' | 'duplicate' | 'skipped' | 'ignored';
}

export interface ScheduleReminderDeps {
  journal: NotificationJournal;
  schedule: ReminderSchedule;
  settings: AppointmentReminderSettingsPort;
  /** Годинник для тестів; за замовчуванням — системний час. */
  now?: () => Date;
}
