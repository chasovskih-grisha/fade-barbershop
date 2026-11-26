// Фейси push-споживача візиту (T-080): push, пристрої, клієнт, відписка,
// журнал — без Prisma/Nest (патерн security-alert.fakes.ts).
import type { AppointmentPushDeps } from './appointment-push-ports';
import type { NotificationJournal } from './booking-confirmation-ports';
import type { DevicePushTokens, PushMessage, PushSender } from './push-ports';

export const OTHER_TOKEN = 'ExponentPushToken[device-a]';
export const SECOND_TOKEN = 'ExponentPushToken[device-b]';

export const makePushFakes = (
  opts: {
    clientId?: string | null;
    pushEnabled?: boolean;
    tokens?: string[];
    handled?: boolean;
    failSend?: Error;
    barberName?: string | null;
  } = {}
) => {
  const pushed: PushMessage[] = [];
  const journalRows: {
    eventId: string;
    type: string;
    channel: string;
    recipient: string;
    subject: string;
    detail?: string;
  }[] = [];
  const push: PushSender = {
    send: jest.fn(async (messages) => {
      if (opts.failSend) throw opts.failSend;
      pushed.push(...messages);
    }),
  };
  const devices: DevicePushTokens = {
    findOtherDeviceTokens: jest.fn().mockResolvedValue([]),
    findTokensByUserId: jest
      .fn()
      .mockResolvedValue(opts.tokens === undefined ? [OTHER_TOKEN] : opts.tokens),
  };
  const clients = {
    findClientIdByAppointmentId: jest
      .fn()
      .mockResolvedValue(opts.clientId === undefined ? 'client-1' : opts.clientId),
  };
  const preferences = {
    isPushEnabled: jest.fn().mockResolvedValue(opts.pushEnabled ?? true),
  };
  const journal: NotificationJournal = {
    alreadyHandled: jest.fn().mockResolvedValue(opts.handled ?? false),
    markSent: jest.fn(async (record) => {
      journalRows.push(record);
    }),
  };
  const barberNames = {
    findName: jest
      .fn()
      .mockImplementation(async (barberId: string) =>
        opts.barberName === undefined ? `${barberId}-name` : opts.barberName
      ),
  };
  const deps: AppointmentPushDeps = {
    push,
    devices,
    clients,
    preferences,
    journal,
    barberNames,
  };
  return { pushed, journalRows, push, devices, clients, preferences, journal, barberNames, deps };
};

export const pushEvent = (
  type: string,
  payload: Record<string, unknown> = {}
): { id: string; type: string; aggregateId: string; payload: unknown } => ({
  id: 'evt-1',
  type,
  aggregateId: 'apt-1',
  payload,
});
