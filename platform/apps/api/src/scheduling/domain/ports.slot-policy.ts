// Ports for per-location slot policy (T-4522).
// Storage holds stepMinutes, bufferMinutes, horizonDays, lastMinuteMinutes.
// Defaults (15 / 0 / 14 / 60) are used when no row exists in DB yet.

/** Repository for a location's slot policy (T-4522). */
export interface SlotPolicyRepository {
  /** Policy for a location or null when not configured yet. */
  forLocation(locationId: string): Promise<SlotPolicyRow | null>;

  /** Create or update a location's policy. */
  save(policy: SlotPolicyRow): Promise<void>;
}

/** Policy row (primitive DTO-like type, read from Prisma). */
export interface SlotPolicyRow {
  id: string;
  locationId: string;
  stepMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  lastMinuteMinutes: number;
  timeZone: string;
}
