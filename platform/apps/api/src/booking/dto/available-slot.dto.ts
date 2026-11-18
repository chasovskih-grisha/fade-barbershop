export interface AvailableSlotDto {
  start: string; // HH:mm
  end: string; // HH:mm
  /** List of barber IDs that can serve this slot – empty array means none (slot filtered out) */
  barbers: string[];
}
