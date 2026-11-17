// ListStaff — queries призначень (MNG-ADM-06): за локацією (адмінка/мобільний
// барбера бачить свої точки), за барбером (картка персоналу). listByBarber —
// барбер у додатку бачить лише призначені йому локації.

import type { StaffAssignment } from '../domain/staff-assignment';
import type { StaffAssignmentRepository } from '../domain/ports';

export class ListStaffHandler {
  constructor(private readonly assignments: StaffAssignmentRepository) {}

  listByLocation(locationId: string): Promise<StaffAssignment[]> {
    return this.assignments.listByLocation(locationId);
  }

  listByBarber(barberId: string): Promise<StaffAssignment[]> {
    return this.assignments.listByBarber(barberId);
  }
}
