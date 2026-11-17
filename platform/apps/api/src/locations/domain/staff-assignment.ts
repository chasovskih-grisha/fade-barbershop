// StaffAssignment — барбер закріплений за локацією (locations README, T-023).
// Міжагрегатне посилання без FK: barberId — рядок (Id агр. identity), locationId —
// рядок (Id агр. locations). Унікальність: один барбер ↔ одна локація.

export interface StaffAssignmentData {
  id: string;
  barberId: string;
  locationId: string;
  createdAt: Date;
}

export class StaffAssignment {
  private constructor(private readonly data: StaffAssignmentData) {}

  static create(input: StaffAssignmentData): StaffAssignment {
    return new StaffAssignment(input);
  }

  static reconstitute(data: StaffAssignmentData): StaffAssignment {
    return new StaffAssignment(data);
  }

  get id(): string {
    return this.data.id;
  }
  get barberId(): string {
    return this.data.barberId;
  }
  get locationId(): string {
    return this.data.locationId;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }
}
