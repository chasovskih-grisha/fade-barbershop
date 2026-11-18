import { SendBookingConfirmation } from './send-booking-confirmation';
import {
  BOOKED_EVENT_TYPE,
  type NotificationJournal,
  type LocationContacts,
  type ClientContacts,
  type NotificationEvent,
  type BookingConfirmationDeps,
} from './booking-confirmation-ports';
import type { EmailSender } from '../../shared/email/ports';
import type { SmsSender } from './booking-confirmation-sms';
import type { BookingConfirmationSettingsPort } from '../domain/booking-confirmation-settings';

export const makeConfirmationDeps = (
  opts: {
    failSend?: Error;
    email?: string | null;
    phone?: string | null;
    channel?: 'email' | 'sms' | 'both' | 'none';
    handled?: boolean;
  } = {}
) => {
  const sent: { to: string; subject: string; text: string }[] = [];
  const smsSent: { to: string; text: string }[] = [];
  const journalRows: string[] = [];
  const email: EmailSender = {
    send: jest.fn(async (input) => {
      if (opts.failSend) throw opts.failSend;
      sent.push(input);
    }),
  };
  const sms: SmsSender = {
    send: jest.fn(async (input) => {
      if (opts.failSend) throw opts.failSend;
      smsSent.push(input);
    }),
  };
  const locations: LocationContacts = {
    findContacts: jest
      .fn()
      .mockResolvedValue(
        opts.email === undefined
          ? { name: 'FADE Podil', address: null, email: 'podil@fade.dev' }
          : { name: 'FADE Podil', address: null, email: opts.email }
      ),
  };
  const clients: ClientContacts = {
    findPhoneByAppointmentId: jest
      .fn()
      .mockResolvedValue(opts.phone === undefined ? '+380501112233' : opts.phone),
    findClientIdByAppointmentId: jest.fn().mockResolvedValue('client-123'),
  };
  const journal: NotificationJournal = {
    alreadyHandled: jest.fn().mockResolvedValue(opts.handled ?? false),
    markSent: jest.fn(async (record) => {
      journalRows.push(record.recipient);
    }),
  };
  const settings: BookingConfirmationSettingsPort = {
    get: jest.fn().mockResolvedValue({ channel: opts.channel ?? 'email' }),
  };
  const deps: BookingConfirmationDeps = { email, sms, locations, clients, journal, settings };
  return { sent, smsSent, journalRows, email, sms, locations, clients, journal, settings, deps };
};

export const confirmationEvent = (
  overrides: Partial<NotificationEvent> = {}
): NotificationEvent => ({
  id: 'evt-1',
  type: BOOKED_EVENT_TYPE,
  aggregateId: 'apt-1',
  payload: {
    appointmentId: 'apt-1',
    locationId: 'loc-1',
    barberId: 'barber-1',
    start: '2026-10-05T10:00:00.000Z',
    end: '2026-10-05T10:30:00.000Z',
  },
  ...overrides,
});

export { SendBookingConfirmation, BOOKED_EVENT_TYPE };
