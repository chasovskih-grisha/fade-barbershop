// SetAppointmentReference (T-043): клієнт/адмін ставить або змінює референс
// зачіски (ID) і коментар на записі. REF-WEB-04: клієнт — поки візит не
// підтверджено барбером (після — ReferenceLockedError); адмін — будь-який
// живий статус (REF-ADM-04, дія логується подією reference_changed); барбер
// не редагує. Коментар — plain text ≤500 (REF-WEB-02); '' прибирає значення.

import { TRANSITIONS } from '../domain/appointment.transitions';
import { Appointment, InvalidTransitionError } from '../domain/appointment.aggregate';
import { AppointmentNotFoundError, type ActorRole } from './appointment-lifecycle.use-case';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { UnitOfWork } from '../../locations/domain/ports';

export class CommentTooLongError extends Error {
  constructor() {
    super('Comment must be 500 characters or fewer');
    this.name = 'CommentTooLongError';
  }
}

export class ReferenceLockedError extends Error {
  constructor(status: string) {
    super(`Reference is locked after confirmation (status: ${status})`);
    this.name = 'ReferenceLockedError';
  }
}

export interface SetAppointmentReferenceDeps {
  appointments: AppointmentRepository;
  uow: UnitOfWork;
}

export interface SetReferenceCommand {
  appointmentId: string;
  actorId: string;
  actorRole: ActorRole;
  /** ID референса (haircut-ai або зовнішній upload); '' — прибрати. */
  referenceId?: string;
  /** Коментар plain text ≤500; '' — прибрати. */
  comment?: string;
}

const MAX_COMMENT = 500;

export class SetAppointmentReference {
  constructor(private readonly deps: SetAppointmentReferenceDeps) {}

  handle(cmd: SetReferenceCommand): Promise<void> {
    return this.deps.uow.run(async () => {
      if ((cmd.comment?.length ?? 0) > MAX_COMMENT) throw new CommentTooLongError();
      const appointment = await this.deps.appointments.findById(cmd.appointmentId);
      if (!appointment) throw new AppointmentNotFoundError(cmd.appointmentId);
      this.assertAllowed(cmd, appointment.data.status);
      appointment.setReference(
        {
          actorId: cmd.actorId,
          actorRole: cmd.actorRole,
          ...(cmd.referenceId === undefined ? {} : { referenceId: cmd.referenceId }),
          ...(cmd.comment === undefined ? {} : { comment: cmd.comment }),
        },
        new Date()
      );
      await this.deps.appointments.save(appointment);
    });
  }

  private assertAllowed(cmd: SetReferenceCommand, status: Appointment['data']['status']): void {
    if (cmd.actorRole === 'barber')
      throw new Error('Barber cannot edit the reference (клієнт або адмін)');
    if (cmd.actorRole === 'client' && TRANSITIONS[status].length === 0)
      throw new InvalidTransitionError(status, status);
    if (cmd.actorRole === 'client' && status !== 'booked') throw new ReferenceLockedError(status);
  }
}
