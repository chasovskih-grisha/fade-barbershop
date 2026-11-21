// Хелпери спек SetAppointmentReference (T-043) — окремо від спеків (max-lines):
// use case над одним записом apt-1, команда від імені клієнта за замовчуванням.
import { SetAppointmentReference } from './set-appointment-reference.use-case';
import {
  FakeAppointmentRepository,
  bookedAppointment,
  passthroughUow,
} from './appointment-lifecycle.fakes';
import type { Appointment } from '../domain/appointment.aggregate';

/** Use case над одним записом apt-1 (за замовчуванням booked). */
export const setupReference = (initial: Appointment = bookedAppointment()) => {
  const repo = new FakeAppointmentRepository(new Map([[initial.data.id, initial]]));
  const useCase = new SetAppointmentReference({ appointments: repo, uow: passthroughUow });
  return { useCase, repo };
};

// prettier-ignore
export const referenceCmd = (overrides: object = {}) => ({ appointmentId: 'apt-1', actorId: 'client-1', actorRole: 'client' as const, ...overrides });

export const confirmedAppointment = () => {
  const appointment = bookedAppointment();
  appointment.confirm({}, new Date());
  return appointment;
};

export const cancelledAppointment = () => {
  const appointment = bookedAppointment();
  appointment.cancel({}, new Date());
  return appointment;
};
