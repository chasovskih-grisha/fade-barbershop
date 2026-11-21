// Доменні події crm. Імена — за конвенцією packages/contracts/events/README.md
// (минулий час, `context.entity.action`). Outbox-реле читає type + payload (T-042).
// Конструктори приймають bundle-об'єкт (гейт max-params ≤ 3).

export { DomainEvent } from './domain-event';
export {
  LoyaltyVisitsChanged,
  VipDiscountChanged,
  LoyaltyVisitsIncremented,
} from './loyalty-events';

import { DomainEvent } from './domain-event';

export class ClientRegistered extends DomainEvent {
  readonly type = 'crm.client.registered';
  readonly payload: { clientId: string; userId: string; phone: string; name: string | null };

  constructor(params: {
    clientId: string;
    userId: string;
    phone: string;
    name: string | null;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      userId: params.userId,
      phone: params.phone,
      name: params.name,
    };
  }
}

export class PreferencesUpdated extends DomainEvent {
  readonly type = 'crm.preferences.updated';
  readonly payload: {
    clientId: string;
    preferences: Array<{ id: string; text: string; createdAt: Date }>;
  };

  constructor(params: {
    clientId: string;
    preferences: Array<{ id: string; text: string; createdAt: Date }>;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { clientId: params.clientId, preferences: params.preferences };
  }
}

/** Payload нотатки — спільний для події і снепшотів (одна форма даних). */
type NotePayload = {
  clientId: string;
  noteId: string;
  text: string;
  authorId: string;
  authorRole: 'barber' | 'admin';
  visibleToClient: boolean;
  createdAt: Date;
};

export class NoteAdded extends DomainEvent {
  readonly type = 'crm.note.added';
  readonly payload: Record<string, unknown>;

  constructor(params: NotePayload & { occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { ...params };
  }
}

export class NoteRemoved extends DomainEvent {
  readonly type = 'crm.note.removed';
  readonly payload: { clientId: string; noteId: string };

  constructor(params: { clientId: string; noteId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.clientId });
    this.payload = { clientId: params.clientId, noteId: params.noteId };
  }
}

export class CampaignSentEvent extends DomainEvent {
  readonly type = 'crm.campaign.sent';
  readonly payload: { clientId: string; campaignId: string; sentAt: Date };

  constructor(params: { clientId: string; campaignId: string; sentAt: Date }) {
    super({ occurredAt: params.sentAt, aggregateId: params.clientId });
    this.payload = {
      clientId: params.clientId,
      campaignId: params.campaignId,
      sentAt: params.sentAt,
    };
  }
}
