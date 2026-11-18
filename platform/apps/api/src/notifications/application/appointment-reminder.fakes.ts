// Фейси споживачів нагадування (T-080): журнал, планувальник, налаштування,
// контакти та SMS — без Prisma/Nest, як у send-booking-confirmation.fakes.ts.
import type { ReminderDuePayload, ReminderSchedule } from './appointment-reminder-ports';
import type {
  ClientContacts,
  LocationContacts,
  NotificationJournal,
  ServiceCatalog,
} from './booking-confirmation-ports';
import type { SmsSender } from './booking-confirmation-sms';
import type {
  AppointmentReminderSettingsPort,
  ReminderChannel,
} from '../domain/appointment-reminder-settings';

export const makeReminderFakes = (
  opts: {
    channel?: ReminderChannel;
    leadMinutes?: number;
    handled?: boolean;
    failSend?: Error;
    failSchedule?: Error;
    phone?: string | null;
    reminderOptOut?: boolean;
    smsEnabled?: boolean;
  } = {}
) => {
  const scheduled: { appointmentId: string; fireAt: Date; payload: ReminderDuePayload }[] = [];
  const cancelled: string[] = [];
  const smsSent: { to: string; text: string }[] = [];
  const journalRows: { eventId: string; channel: string; recipient: string; detail?: string }[] =
    [];
  const schedule: ReminderSchedule = {
    schedule: jest.fn(async (input) => {
      if (opts.failSchedule) throw opts.failSchedule;
      scheduled.push(input);
    }),
    cancelPending: jest.fn(async (id: string) => {
      cancelled.push(id);
      return 1;
    }),
  };
  const journal: NotificationJournal = {
    alreadyHandled: jest.fn().mockResolvedValue(opts.handled ?? false),
    markSent: jest.fn(async (record) => {
      journalRows.push(record);
    }),
  };
  const settings: AppointmentReminderSettingsPort = {
    get: jest.fn().mockResolvedValue({
      channel: opts.channel ?? 'sms',
      leadMinutes: opts.leadMinutes ?? 24 * 60,
    }),
    set: jest.fn(),
  };
  const sms: SmsSender = {
    send: jest.fn(async (input) => {
      if (opts.failSend) throw opts.failSend;
      smsSent.push(input);
    }),
  };
  const clients: ClientContacts & { findClientIdByAppointmentId: jest.Mock } = {
    findPhoneByAppointmentId: jest
      .fn()
      .mockResolvedValue(opts.phone === undefined ? '+380501112233' : opts.phone),
    findClientIdByAppointmentId: jest.fn().mockResolvedValue('client-123'),
  };
  const preferences = {
    getPreferences: jest.fn().mockResolvedValue({
      reminderOptOut: opts.reminderOptOut ?? false,
      smsEnabled: opts.smsEnabled ?? true,
    }),
    isOptedOut: jest.fn().mockResolvedValue(opts.reminderOptOut ?? false),
  };
  const locations: LocationContacts = {
    findContacts: jest
      .fn()
      .mockResolvedValue({ name: 'FADE Podil', address: 'вул. Хрещатик 1', email: null }),
  };
  const services: ServiceCatalog = { findName: jest.fn().mockResolvedValue('Чоловіча стрижка') };
  return {
    scheduled,
    cancelled,
    smsSent,
    journalRows,
    schedule,
    journal,
    settings,
    sms,
    clients,
    preferences,
    locations,
    services,
  };
};

export type ReminderFakes = ReturnType<typeof makeReminderFakes>;
