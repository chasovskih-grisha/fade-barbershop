import type { LocationLogo } from '../domain/location-logo';
import type { LocationLogoRepository, StaffAssignmentRepository } from '../domain/ports';
import type { StaffAssignment } from '../domain/staff-assignment';

export class FakeStaffAssignmentRepository implements StaffAssignmentRepository {
  private store = new Map<string, StaffAssignment>();
  async findById(id: string): Promise<StaffAssignment | null> {
    return this.store.get(id) ?? null;
  }
  async findByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<StaffAssignment | null> {
    return (
      [...this.store.values()].find(
        (a) => a.barberId === barberId && a.locationId === locationId
      ) ?? null
    );
  }
  async save(assignment: StaffAssignment): Promise<void> {
    this.store.set(assignment.id, assignment);
  }
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
  async listByLocation(locationId: string): Promise<StaffAssignment[]> {
    return [...this.store.values()].filter((a) => a.locationId === locationId);
  }
  async listByBarber(barberId: string): Promise<StaffAssignment[]> {
    return [...this.store.values()].filter((a) => a.barberId === barberId);
  }
  get all(): StaffAssignment[] {
    return [...this.store.values()];
  }
}

/** Фейк репозиторія логотипів (T-4609a): один логотип на локацію. */
export class FakeLocationLogoRepository implements LocationLogoRepository {
  private store = new Map<string, LocationLogo>();
  async findByLocationId(locationId: string): Promise<LocationLogo | null> {
    return this.store.get(locationId) ?? null;
  }
  async listByLocationIds(locationIds: string[]): Promise<LocationLogo[]> {
    // `!= null` — і null, і undefined (Map.get без ключа), інакше в масиві
    // опиняються undefined і DTO-мапінг падає.
    return locationIds
      .map((id) => this.store.get(id))
      .filter((logo): logo is LocationLogo => logo != null);
  }
  async save(logo: LocationLogo): Promise<void> {
    this.store.set(logo.locationId, logo);
  }
  async delete(locationId: string): Promise<void> {
    this.store.delete(locationId);
  }
}

/** Геокодер-фейк: повертає зашите місто або кидає (для fallback-тестів). */
export class FakeGeocoder {
  constructor(
    private readonly city: string | null = 'Київ',
    private readonly fail = false
  ) {}
  calls: Array<[number, number]> = [];
  async reverseGeocode(lat: number, lng: number): Promise<{ city: string } | null> {
    this.calls.push([lat, lng]);
    if (this.fail) throw new Error('geocoder down');
    return this.city ? { city: this.city } : null;
  }
}
