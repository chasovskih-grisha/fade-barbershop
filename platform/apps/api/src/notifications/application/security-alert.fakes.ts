// Хелпери спеки NewDeviceAlert (T-4422): заготовки deps, події входу і
// зібраних відправок. Окремо від *.spec.ts — гейт max-lines (ADR 0019).

import type { SecurityAlertDeps, SecurityAlertEvent } from './security-alert-ports';
import type { PushMessage } from './push-ports';
import type { NotificationRecordInput } from './booking-confirmation-ports';

export const OTHER_TOKEN = 'ExpoPushToken[other-device-token]';

export interface AlertSpy {
  deps: SecurityAlertDeps;
  sent: { to: string; subject: string; text: string; html?: string }[];
  pushed: PushMessage[];
  journalRows: NotificationRecordInput[];
}

/** deps на шпигунах: email клієнта (або null) + токени інших пристроїв. */
export function setup(email: string | null, otherTokens: string[] = []): AlertSpy {
  const sent: AlertSpy['sent'] = [];
  const pushed: PushMessage[] = [];
  const journalRows: NotificationRecordInput[] = [];
  const deps: SecurityAlertDeps = {
    email: {
      send: jest.fn(async (input) => {
        sent.push(input);
      }),
    },
    push: {
      send: jest.fn(async (messages) => {
        pushed.push(...messages);
      }),
    },
    users: { findEmailByUserId: jest.fn().mockResolvedValue(email) },
    devices: {
      findOtherDeviceTokens: jest.fn().mockResolvedValue(otherTokens),
      findTokensByUserId: jest.fn().mockResolvedValue(otherTokens),
    },
    journal: {
      alreadyHandled: jest.fn().mockResolvedValue(false),
      markSent: jest.fn(async (record) => {
        journalRows.push(record);
      }),
    },
  };
  return { deps, sent, pushed, journalRows };
}

export const startedEvent = (channel: 'web' | 'mobile' = 'web'): SecurityAlertEvent => ({
  id: 'evt-1',
  type: 'identity.session.started',
  aggregateId: 'u-1',
  payload: { sessionId: 's-new', userId: 'u-1', channel },
});
