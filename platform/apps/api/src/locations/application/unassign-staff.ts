// UnassignStaff — команда «зняти барбера з локації» (MNG-ADM-06).
// Ідемпотентна: повторне зняття (коли призначення нема) → помилка not found.

import { StaffUnassigned } from '../domain/location.events';
import type { Clock, Outbox, StaffAssignmentRepository, UnitOfWork } from '../domain/ports';
import { StaffAssignmentNotFoundError, InvalidStaffInputError } from './staff-errors';

export interface UnassignStaffDeps {
  assignments: StaffAssignmentRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class UnassignStaffHandler {
  constructor(private readonly deps: UnassignStaffDeps) {}

  async handle(id: string): Promise<{ id: string }> {
    const { assignments, outbox, clock, uow } = this.deps;
    if (!id.trim()) throw new InvalidStaffInputError('assignment id is required');

    return uow.run(async () => {
      const assignment = await assignments.findById(id);
      if (!assignment) throw new StaffAssignmentNotFoundError();

      await assignments.delete(id);
      await outbox.append([
        new StaffUnassigned({
          id: assignment.id,
          barberId: assignment.barberId,
          locationId: assignment.locationId,
          occurredAt: clock.now(),
        }),
      ]);
      return { id };
    });
  }
}
