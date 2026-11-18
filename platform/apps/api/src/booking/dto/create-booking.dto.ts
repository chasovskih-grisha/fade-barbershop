export interface CreateBookingDto {
  /** Optional – if omitted the system picks any free barber */
  barberId?: string;
  locationId: string;
  dayOfWeek: number;
  start: string; // HH:mm
  end: string; // HH:mm
  /** Service duration in minutes – defaults to 30 if omitted */
  serviceDuration?: number;
}
