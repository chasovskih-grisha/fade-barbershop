// Події та збірка депсів для фейсів нагадування (T-080): фіксований «сьогодні»,
// візит за добу, подія запису й дозріла подія reminder.due. Розділено з
// appointment-reminder.fakes.ts за LOC-гейтом; споживачі — планувальник і
// споживач доставки.
import { REMINDER_DUE_EVENT_TYPE, REMINDER_TRIGGER_BOOKED } from './appointment-reminder-ports';
import type { ReminderDuePayload, ScheduleReminderDeps } from './appointment-reminder-ports';
import type { NotificationEvent } from './booking-confirmation-ports';
import type { SendAppointmentReminderDeps } from './send-appointment-reminder';
import type { ReminderFakes } from './appointment-reminder.fakes';
import { ScheduleAppointmentReminder } from './schedule-appointment-reminder';

/** Опорний момент: 2026-10-01 12:00 Europe/Kyiv. */
export const NOW = new Date('2026-10-01T09:00:00.000Z');
/** Візит за добу до NOW; нагадування настає за leadMinutes до старту. */
export const VISIT_START = '2026-10-02T10:00:00.000Z';
export const FIRE_AT = '2026-10-01T10:00:00.000Z';

/** Deps планувальника: типові депси фейсів + фіксований годинник. */
export const plannerDeps = (fakes: ReminderFakes): ScheduleReminderDeps => ({
  journal: fakes.journal,
  schedule: fakes.schedule,
  settings: fakes.settings,
  now: () => NOW,
});

export const senderDeps = (fakes: ReminderFakes): SendAppointmentReminderDeps => ({
  sms: fakes.sms,
  journal: fakes.journal,
  clients: fakes.clients,
  locations: fakes.locations,
  settings: fakes.settings,
  preferences: fakes.preferences,
  services: fakes.services,
});

/** Прогін планувальника на фейках: спільний вхід для спек нагадувань. */
export const runPlanner = (
  fakes: ReminderFakes,
  event: NotificationEvent = visitEvent()
): ReturnType<ScheduleAppointmentReminder['handleOne']> =>
  new ScheduleAppointmentReminder(plannerDeps(fakes)).handleOne(event);

/** Подія запису/перенесення, з якої планується нагадування. */
export const visitEvent = (overrides: Partial<NotificationEvent> = {}): NotificationEvent => ({
  id: 'evt-booked-1',
  type: REMINDER_TRIGGER_BOOKED,
  aggregateId: 'apt-1',
  payload: { locationId: 'loc-1', serviceId: 'svc-1', start: VISIT_START },
  ...overrides,
});

/** Відкладена подія нагадування, коли вона вже настала. */
export const dueEvent = (overrides: Partial<NotificationEvent> = {}): NotificationEvent => ({
  id: 'evt-due-1',
  type: REMINDER_DUE_EVENT_TYPE,
  aggregateId: 'apt-1',
  payload: {
    appointmentId: 'apt-1',
    fireAt: FIRE_AT,
    start: VISIT_START,
    locationId: 'loc-1',
    serviceId: 'svc-1',
  } satisfies ReminderDuePayload,
  ...overrides,
});
