// Ports for the barber x service x location matrix (T-4522).
// Interface lives in scheduling/domain and knows nothing about HTTP/Prisma;
// the admin layer and the slot generator (booking/infrastructure) consume via these.

/** Snapshot passed into slot generation (repository -> generator). */
export interface BarberServiceAssignmentSnapshot {
  /** { barberId: { locationId: Set<serviceId> } }. Keys removed when active=false. */
  matrix: Map<string, Map<string, Set<string>>>;
}

/** Repository for the barber-service assignment matrix (T-4522).
 * Default: no restrictions (a barber serves all services). */
export interface BarberServiceAssignmentRepository {
  /** Snapshot of the matrix for a location: { barberId: { locationId: serviceId[] } }. */
  snapshotForLocation(locationId: string): Promise<BarberServiceAssignmentSnapshot>;

  /** Create or update an assignment. active=false means the barber does not serve the service at the location. */
  setAssignment(input: {
    barberId: string;
    locationId: string;
    serviceId: string;
    active: boolean;
  }): Promise<void>;

  /** Remove all assignments for a barber at a location (on deactivation / deletion). */
  removeAssignmentsForBarber(barberId: string, locationId: string): Promise<void>;
}
