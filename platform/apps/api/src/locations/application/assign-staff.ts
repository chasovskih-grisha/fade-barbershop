// AssignStaff — команда «закріпити барбера за локацією» (MNG-ADM-06).
// Барбер може бути прикріплений до кількох точок мережі; одна пара
// барбер↔локація унікальна. Призначення існує лише для реальних сутностей
// (перевірка барбера — через id, локації — через locations-репозиторій).

import { StaffAssignment } from '../domain/staff-assignment';
import { StaffAssigned } from '../domain/location.events';
import type {
  Clock,
  IdGenerator,
  LocationRepository,
  Outbox,
  StaffAssignmentRepository,
  UnitOfWork,
} from '../domain/ports';
import { StaffAlreadyAssignedError, InvalidStaffInputError } from './staff-errors';
import { LocationNotFoundError } from './locations-errors';

export interface AssignStaffInput {
  barberId: string;
  locationId: string;
}

export interface AssignStaffDeps {
  assignments: StaffAssignmentRepository;
  locations: LocationRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class AssignStaffHandler {
  constructor(private readonly deps: AssignStaffDeps) {}

  async handle(input: AssignStaffInput): Promise<{ id: string }> {
    const { assignments, locations, outbox, clock, ids, uow } = this.deps;
    const barberId = input.barberId.trim();
    const locationId = input.locationId.trim();
    if (!barberId || !locationId)
      throw new InvalidStaffInputError('barberId and locationId are required');

    return uow.run(async () => {
      const location = await locations.findById(locationId);
      if (!location) throw new LocationNotFoundError();

      const existing = await assignments.findByBarberAndLocation(barberId, locationId);
      if (existing) throw new StaffAlreadyAssignedError();

      const now = clock.now();
      const assignment = StaffAssignment.create({
        id: ids.id(),
        barberId,
        locationId,
        createdAt: now,
      });
      await assignments.save(assignment);
      await outbox.append([
        new StaffAssigned({ id: assignment.id, barberId, locationId, occurredAt: now }),
      ]);
      return { id: assignment.id };
    });
  }
}
