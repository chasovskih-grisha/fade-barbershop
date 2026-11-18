// Життєвий цикл Appointment — команди мовою домену (T-042a/b):
// confirm, start, cancel, reschedule, complete, markNoShow. Транзакція =
// один виклик (UnitOfWork). Правила акторів (README scheduling): скасування
// і перенесення — клієнт або адмін, не барбер; complete/no_show — барбер або
// адмін на кріслі. Статуси не відкочуються — ADT-модель агрегата.

import { Appointment, InvalidTransitionError } from '../domain/appointment.aggregate';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { UnitOfWork } from '../../locations/domain/ports';

export class AppointmentNotFoundError extends Error {
  constructor(id: string) {
    super(`Appointment ${id} not found`);
    this.name = 'AppointmentNotFoundError';
  }
}

export type ActorRole = 'client' | 'barber' | 'admin';

export interface AppointmentLifecycleDeps {
  appointments: AppointmentRepository;
  uow: UnitOfWork;
}

interface Command {
  appointmentId: string;
  actorId: string;
  actorRole: ActorRole;
}

export class AppointmentLifecycle {
  constructor(private readonly deps: AppointmentLifecycleDeps) {}

  confirm(cmd: Command): Promise<void> {
    return this.run(cmd, (appointment, now) =>
      appointment.confirm({ actorId: cmd.actorId, actorRole: cmd.actorRole }, now)
    );
  }

  start(cmd: Command): Promise<void> {
    return this.run(cmd, (appointment, now) =>
      appointment.startVisit({ actorId: cmd.actorId, actorRole: cmd.actorRole }, now)
    );
  }

  complete(cmd: Command): Promise<void> {
    return this.run(cmd, (appointment, now) => appointment.complete(now));
  }

  markNoShow(cmd: Command): Promise<void> {
    return this.run(cmd, (appointment, now) =>
      appointment.markNoShow({ actorId: cmd.actorId, actorRole: cmd.actorRole }, now)
    );
  }
  cancel(cmd: Command & { reason?: string }): Promise<void> {
    return this.run(cmd, (appointment, now) => {
      assertNotBarber(cmd, 'cancel');
      appointment.cancel(
        cmd.reason === undefined
          ? { actorId: cmd.actorId, actorRole: cmd.actorRole }
          : { actorId: cmd.actorId, actorRole: cmd.actorRole, reason: cmd.reason },
        now
      );
    });
  }

  reschedule(cmd: Command & { start: string; end: string }): Promise<void> {
    return this.run(cmd, (appointment, now) => {
      assertNotBarber(cmd, 'reschedule');
      appointment.reschedule(
        { start: cmd.start, end: cmd.end, actorId: cmd.actorId, actorRole: cmd.actorRole },
        now
      );
    });
  }

  private run(cmd: Command, work: (appointment: Appointment, now: Date) => void): Promise<void> {
    return this.deps.uow.run(async () => {
      const appointment = await this.load(cmd.appointmentId);
      work(appointment, new Date());
      await this.deps.appointments.save(appointment);
    });
  }

  private async load(id: string): Promise<Appointment> {
    const appointment = await this.deps.appointments.findById(id);
    if (!appointment) throw new AppointmentNotFoundError(id);
    return appointment;
  }
}

function assertNotBarber(cmd: Command, action: string): void {
  if (cmd.actorRole === 'barber')
    throw new Error(
      `Barber cannot ${action} an appointment (скасування/перенесення — клієнт або адмін)`
    );
}

export { InvalidTransitionError };
