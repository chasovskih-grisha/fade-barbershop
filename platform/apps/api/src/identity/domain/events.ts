// Доменні події identity. Імена — за конвенцією packages/contracts/events/README.md
// (минулий час, `context.entity.action`). Outbox-реле читає type + payload (T-042).
// Події сесій — у events.session.ts, клієнтських сесій/пристроїв — у
// events.client-sessions.ts, облікових записів — в account.events.ts.

export abstract class DomainEvent {
  abstract readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  abstract readonly payload: Record<string, unknown>;

  constructor(params: { occurredAt: Date; aggregateId: string }) {
    this.occurredAt = params.occurredAt;
    this.aggregateId = params.aggregateId;
  }
}

export class OtpRequested extends DomainEvent {
  readonly type = 'identity.otp.requested';
  readonly payload: Record<string, string>;

  constructor(
    phone: string,
    occurredAt: Date,
    purpose: 'login' | 'booking' | 'phone_change' = 'login'
  ) {
    super({ occurredAt, aggregateId: phone });
    this.payload = { phone, purpose };
  }
}

/** Номер клієнта верифіковано через OTP (T-4409: адмін ініціював для
 * телефонного запису). Подія — тригер майбутніх автоматріггерів. */
export class PhoneVerified extends DomainEvent {
  readonly type = 'identity.phone.verified';
  readonly payload: { userId: string; phone: string; actorId: string };

  constructor(params: { userId: string; phone: string; actorId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.userId });
    this.payload = { userId: params.userId, phone: params.phone, actorId: params.actorId };
  }
}

export class UserRegistered extends DomainEvent {
  readonly type = 'identity.user.registered';
  readonly payload: { id: string; phone: string };

  constructor(id: string, phone: string, occurredAt: Date) {
    super({ occurredAt, aggregateId: id });
    this.payload = { id, phone };
  }
}

// Події сесій — у events.session.ts (реекспорт тримає стабільний імпорт).
export { SessionStarted, SessionRevoked, SessionRefreshed } from './events.session';

// T-046: адмін створив клієнта «на місці» (телефонний запис без першого входу).
// Споживачі (майбутні автотригери) читають userId — той самий id, що йде в
// origin.clientId візиту.
export class ClientCreated extends DomainEvent {
  readonly type = 'identity.client.created';
  readonly payload: { userId: string; phone: string; actorId: string };

  constructor(params: { userId: string; phone: string; actorId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.userId });
    this.payload = { userId: params.userId, phone: params.phone, actorId: params.actorId };
  }
}

export class BarberRegistered extends DomainEvent {
  readonly type = 'identity.barber.registered';
  readonly payload: { id: string; phone: string; name: string | null };

  constructor(input: { id: string; phone: string; name: string | null }, occurredAt: Date) {
    super({ occurredAt, aggregateId: input.id });
    this.payload = { id: input.id, phone: input.phone, name: input.name };
  }
}

export class BarberUpdated extends DomainEvent {
  readonly type = 'identity.barber.updated';
  readonly payload: { id: string };
  readonly changed: { name?: string | null; selfSchedule?: boolean };

  constructor(id: string, changed: BarberUpdated['changed'], occurredAt: Date) {
    super({ occurredAt, aggregateId: id });
    this.payload = { id };
    this.changed = changed;
  }
}

export class BarberDeactivated extends DomainEvent {
  readonly type = 'identity.barber.deactivated';
  readonly payload: { id: string };

  constructor(id: string, occurredAt: Date) {
    super({ occurredAt, aggregateId: id });
    this.payload = { id };
  }
}

export class BarberActivated extends DomainEvent {
  readonly type = 'identity.barber.activated';
  readonly payload: { id: string };

  constructor(id: string, occurredAt: Date) {
    super({ occurredAt, aggregateId: id });
    this.payload = { id };
  }
}

/** T-4620a: клієнт змінив номер телефону (той самий User). payload несе
 * старий і новий номер — споживачі (сповіщення безпеки) бачать обидві сторони. */
export class PhoneChanged extends DomainEvent {
  readonly type = 'identity.user.phone.changed';
  readonly payload: { userId: string; oldPhone: string; newPhone: string };

  constructor(params: { userId: string; oldPhone: string; newPhone: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.userId });
    this.payload = {
      userId: params.userId,
      oldPhone: params.oldPhone,
      newPhone: params.newPhone,
    };
  }
}
