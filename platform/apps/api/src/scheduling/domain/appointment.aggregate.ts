// Агрегат Appointment (T-042a): один запис людини до барбера; життєвий цикл
// за README scheduling, ADT-таблиця переходів — appointment.transitions.ts.
// Скасування/перенесення — клієнт або адмін, не барбер (перевіряє use case).
// Гроші (AgreedPrice снепшот) живуть на Booking (PAY-004) — тут лише час/статус.
// Supports multi-position bookings (T-4520a).
import type { DomainEvent } from '../../locations/domain/location.events';
import {
  TRANSITIONS,
  InvalidTransitionError,
  ensureAlive,
  type AppointmentStatus,
} from './appointment.transitions';
import type { AppointmentEventInput } from './appointment.events';
import {
  AppointmentBooked,
  AppointmentCancelled,
  AppointmentCompleted,
  AppointmentConfirmed,
  AppointmentNoShowed,
  AppointmentReferenceChanged,
  AppointmentRescheduled,
  AppointmentStarted,
} from './appointment.events';
import { appointmentEventInput, type AppointmentData, type ActorInput } from './appointment.data';

export { InvalidTransitionError, type AppointmentStatus } from './appointment.transitions';
export type { AppointmentData, ActorInput } from './appointment.data';

export class Appointment {
  private events: DomainEvent[] = [];
  private constructor(public data: AppointmentData) {}

  static reconstitute(data: AppointmentData): Appointment {
    return new Appointment(data);
  }

  // prettier-ignore
  static book(input: Omit<AppointmentData, 'status' | 'cancelReason'>, occurredAt: Date): Appointment {
    const appointment = new Appointment({ ...input, status: 'booked' });
    appointment.emit(new AppointmentBooked(appointment.eventInput(occurredAt)));
    return appointment;
  }

  private emit(event: DomainEvent): void {
    this.events.push(event);
  }

  pullEvents(): DomainEvent[] {
    return [...this.events];
  }

  // prettier-ignore
  confirm(input: ActorInput, occurredAt: Date): void { this.transition('confirmed', new AppointmentConfirmed({ ...this.eventInput(occurredAt), ...input })); }

  /** Почати візит (in_progress) — ім'я startVisit: start зайнятий геттером часу. */
  // prettier-ignore
  startVisit(input: ActorInput, occurredAt: Date): void { this.transition('in_progress', new AppointmentStarted({ ...this.eventInput(occurredAt), ...input })); }

  // prettier-ignore
  complete(occurredAt: Date): void { this.transition('completed', new AppointmentCompleted(this.eventInput(occurredAt))); }

  // prettier-ignore
  markNoShow(input: ActorInput, occurredAt: Date): void { this.transition('no_show', new AppointmentNoShowed({ ...this.eventInput(occurredAt), ...input })); }

  /** Перенесення часу — у будь-якому живому статусі; статус не міняється. */
  reschedule(input: { start: string; end: string } & ActorInput, occurredAt: Date): void {
    ensureAlive(this.data);
    this.emit(new AppointmentRescheduled({ ...this.eventInput(occurredAt), ...input }));
    this.data = { ...this.data, start: input.start, end: input.end };
  }

  /** Референс/коментар (T-043): живий статус; клієнт — до підтвердження (use case); '' прибирає. */
  setReference(
    input: { referenceId?: string; comment?: string } & ActorInput,
    occurredAt: Date
  ): void {
    ensureAlive(this.data);
    // prettier-ignore
    this.data = { ...this.data, ...(input.referenceId === undefined ? {} : { haircutReferenceId: input.referenceId || null }), ...(input.comment === undefined ? {} : { appointmentComment: input.comment || null }) };
    this.emit(new AppointmentReferenceChanged({ ...this.eventInput(occurredAt), ...input }));
  }

  // prettier-ignore
  cancel(input: { reason?: string } & ActorInput, occurredAt: Date): void {
    this.transition('cancelled', new AppointmentCancelled({ ...this.eventInput(occurredAt), ...input }));
    this.data = { ...this.data, cancelReason: input.reason ?? '' };
  }

  private transition(to: AppointmentStatus, event: DomainEvent): void {
    if (!TRANSITIONS[this.data.status].includes(to))
      throw new InvalidTransitionError(this.data.status, to);
    this.data = { ...this.data, status: to };
    this.emit(event);
  }

  private eventInput(occurredAt: Date): AppointmentEventInput {
    return appointmentEventInput(this.data, occurredAt);
  }

  /** Перевірка чи візит у живому статусі. */
  public isAlive(): boolean {
    return ['booked', 'confirmed', 'in_progress'].includes(this.data.status);
  }
}
