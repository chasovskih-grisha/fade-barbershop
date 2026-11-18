// Форми і порт use-case RescheduleAppointment (T-4533) — окремо від класу:
// порт mover реалізує PrismaAppointmentTimeMover, форми юзають контролер і спеки.
import type { BarberSchedule } from '../domain/availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { ActorRole } from './appointment-lifecycle.use-case';

/** Порт атомарного переносу часу (провайдер — PrismaAppointmentTimeMover). */
export interface AppointmentTimeMover {
  moveTime(query: {
    appointmentId: string;
    newStart: Date;
    newEnd: Date;
    event: { type: string; payload: Record<string, string> };
  }): Promise<{ oldStart: Date; oldEnd: Date } | null>;
}

/** Форма запиту на перенос — спільна для порта й провайдера. */
export type MoveTimeQuery = Parameters<AppointmentTimeMover['moveTime']>[0];

export interface RescheduleAppointmentDeps {
  appointments: AppointmentRepository;
  scheduleRepo: {
    findByBarberAndLocation(barberId: string, locationId: string): Promise<BarberSchedule | null>;
  };
  locationRepo: {
    findById(id: string): Promise<{ hours: OpeningHours } | null>;
  };
  mover: AppointmentTimeMover;
}

export interface RescheduleCommand {
  appointmentId: string;
  actorId: string;
  actorRole: ActorRole;
  /** YYYY-MM-DD нової дати (може бути той самий день). */
  date: string;
  start: string;
  end: string;
}
