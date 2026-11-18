import type { SmsSender } from './booking-confirmation-sms';
import type { PushSender } from './push-ports';
import type { ClientContacts } from '../infrastructure/client-contacts';
import type { DevicePushTokens } from './push-ports';

export interface LoyaltyNotificationEvent {
  id: string;
  aggregateId: string;
  type: string;
  payload: {
    clientId: string;
    oldCount?: number;
    newCount?: number;
    counter?: number;
    appointmentId?: string;
  };
}

export interface LoyaltyNotificationDeps {
  sms: SmsSender;
  push: PushSender;
  clients: ClientContacts;
  devices: DevicePushTokens;
  preferences?: {
    isOptedOut(clientId: string): Promise<boolean>;
  };
  journal: {
    alreadyHandled(eventId: string): Promise<boolean>;
    markSent(params: {
      eventId: string;
      type: string;
      channel: string;
      recipient: string;
      subject: string;
      detail?: string;
    }): Promise<void>;
  };
}
