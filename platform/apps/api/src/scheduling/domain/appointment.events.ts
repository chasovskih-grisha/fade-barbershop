// Доменні події context scheduling (життєвий цикл Appointment, T-042).
// Імена — `scheduling.appointment.*`; outbox-реле читає type + payload.
// Снепшот ціни на події не виносимо — гроші живуть у billing (PAY-004).

import { DomainEvent } from '../../locations/domain/location.events';

export interface AppointmentEventInput {
  appointmentId: string;
  locationId: string;
  barberId: string;
  occurredAt?: Date;
  start?: string;
  end?: string;
  actorId?: string;
  actorRole?: string;
  reason?: string;
  /** Референс зачіски (T-043): ID із haircut-ai або зовнішнього upload. */
  referenceId?: string;
  /** Коментар до візиту (T-043): plain text ≤500. */
  comment?: string;
}

/** База: payload формується з input без undefined-полів (exactOptional). */
abstract class AppointmentEvent extends DomainEvent {
  readonly payload: Record<string, string>;
  constructor(input: AppointmentEventInput, payload: Record<string, string>) {
    super({ occurredAt: input.occurredAt ?? new Date(), aggregateId: input.appointmentId });
    this.payload = payload;
  }
}

// prettier-ignore
const actorFields = (i: AppointmentEventInput) => ({
  ...(i.actorId === undefined ? {} : { actorId: i.actorId }),
  ...(i.actorRole === undefined ? {} : { actorRole: i.actorRole }),
});

export class AppointmentBooked extends AppointmentEvent {
  readonly type = 'scheduling.appointment.booked';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, locationId: input.locationId, barberId: input.barberId, ...(input.start === undefined ? {} : { start: input.start }), ...(input.end === undefined ? {} : { end: input.end }) });
  }
}

export class AppointmentConfirmed extends AppointmentEvent {
  readonly type = 'scheduling.appointment.confirmed';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, ...actorFields(input) });
  }
}

export class AppointmentStarted extends AppointmentEvent {
  readonly type = 'scheduling.appointment.started';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, ...actorFields(input) });
  }
}

export class AppointmentRescheduled extends AppointmentEvent {
  readonly type = 'scheduling.appointment.rescheduled';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, start: input.start ?? '', end: input.end ?? '', ...actorFields(input) });
  }
}

export class AppointmentReferenceChanged extends AppointmentEvent {
  readonly type = 'scheduling.appointment.reference_changed';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, ...(input.referenceId === undefined ? {} : { haircutReferenceId: input.referenceId }), ...(input.comment === undefined ? {} : { comment: input.comment }), ...actorFields(input) });
  }
}

export class AppointmentCancelled extends AppointmentEvent {
  readonly type = 'scheduling.appointment.cancelled';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, ...(input.reason === undefined ? {} : { reason: input.reason }), ...actorFields(input) });
  }
}

export class AppointmentCompleted extends AppointmentEvent {
  readonly type = 'scheduling.appointment.completed';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, locationId: input.locationId, barberId: input.barberId });
  }
}

export class AppointmentNoShowed extends AppointmentEvent {
  readonly type = 'scheduling.appointment.no_showed';
  // prettier-ignore
  constructor(input: AppointmentEventInput) {
    super(input, { appointmentId: input.appointmentId, ...actorFields(input) });
  }
}
