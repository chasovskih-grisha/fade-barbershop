/* eslint-disable complexity -- T-4616a adds one optional reassignment branch to the existing reschedule validation. */
// RescheduleAppointment (T-4533): єдиний use case перенесення запису на іншу
// дату/час. Не cancel-and-recreate: appointmentId, клієнт, барбер, локація,
// послуга/ціни, статус і оплата лишаються на рядку Booking — міняється лише
// час. Новий слот проходить ті самі валідації, що новий запис (Availability,
// OpeningHours, тривалість); звільнення старого й бронювання нового — атомарно
// в транзакції (PrismaAppointmentTimeMover), конфлікт → BookingConflictError.

import { TRANSITIONS } from '../domain/appointment.transitions';
import { InvalidTransitionError } from '../domain/appointment.aggregate';
import { InvalidSlotError, SlotValidator, type TimeSlotData } from '../domain/slot-validator';
import { dayOfWeekFor } from '../domain/day-of-week';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';
import type {
  AppointmentTimeMover,
  RescheduleAppointmentDeps,
  RescheduleCommand,
} from './reschedule-appointment.types';

export type { AppointmentTimeMover, RescheduleAppointmentDeps, RescheduleCommand };

const toMinutes = (t: string): number => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export class RescheduleAppointment {
  constructor(private readonly deps: RescheduleAppointmentDeps) {}

  async handle(cmd: RescheduleCommand): Promise<void> {
    // Доменний спан (T-4204): валідації слота і атомарний move — один крок;
    // доменні відмови (конфлікт, невалідний слот) — ERROR-спан з винятком.
    return withSpan({
      name: TRACING.BOOKING_RESCHEDULE,
      options: { attributes: { 'fade.booking.appointment_id': cmd.appointmentId } },
      work: () => this.handleSpanned(cmd),
    });
  }

  private async handleSpanned(cmd: RescheduleCommand): Promise<void> {
    if (cmd.actorRole === 'barber')
      throw new Error(
        'Barber cannot reschedule an appointment (скасування/перенесення — клієнт або адмін)'
      );
    const appointment = await this.deps.appointments.findById(cmd.appointmentId);
    if (!appointment) throw new AppointmentNotFoundError(cmd.appointmentId);
    if (TRANSITIONS[appointment.data.status].length === 0)
      throw new InvalidTransitionError(appointment.data.status, appointment.data.status);

    const duration = toMinutes(appointment.data.end) - toMinutes(appointment.data.start);
    if (toMinutes(cmd.end) - toMinutes(cmd.start) !== duration)
      throw InvalidSlotError.of('Reschedule must preserve the service duration');
    const dayOfWeek = dayOfWeekFor(cmd.date);
    const newStart = new Date(`${cmd.date}T${cmd.start}:00.000Z`);
    const newEnd = new Date(`${cmd.date}T${cmd.end}:00.000Z`);
    if (!Number.isFinite(newStart.getTime()) || !Number.isFinite(newEnd.getTime()))
      throw InvalidSlotError.of('Invalid reschedule date');

    const barberId = cmd.barberId ?? appointment.data.barberId;
    const schedule = await this.deps.scheduleRepo.findByBarberAndLocation(
      barberId,
      appointment.data.locationId
    );
    if (!schedule) throw InvalidSlotError.of('Barber has no availability for this slot');
    const location = await this.deps.locationRepo.findById(appointment.data.locationId);
    if (!location) throw InvalidSlotError.of('Location not found');
    const slot: TimeSlotData = { date: cmd.date, dayOfWeek, start: cmd.start, end: cmd.end };
    new SlotValidator(schedule, location.hours, duration).validate(slot);

    // Атомарність move + outbox гарантує mover (власна Serializable-транзакція).
    await this.deps.mover.moveTime({
      appointmentId: cmd.appointmentId,
      newStart,
      newEnd,
      ...(cmd.barberId ? { newBarberId: cmd.barberId } : {}),
      event: {
        type: 'scheduling.appointment.rescheduled',
        payload: {
          appointmentId: cmd.appointmentId,
          actorId: cmd.actorId,
          actorRole: cmd.actorRole,
          newStart: newStart.toISOString(),
          newEnd: newEnd.toISOString(),
          ...(cmd.barberId ? { barberId: cmd.barberId } : {}),
        },
      },
    });
  }
}
