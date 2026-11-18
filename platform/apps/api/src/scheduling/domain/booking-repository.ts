export interface BookingRepository {
  /** Save a booking (create) */
  save(booking: import('../domain/booking').Booking): Promise<void>;
  /** Find bookings that overlap the given time range for a location */
  findOverlaps(
    locationId: string,
    start: Date,
    end: Date
  ): Promise<import('../domain/booking').Booking[]>;
  findAllOverlaps(start: Date, end: Date): Promise<import('../domain/booking').Booking[]>;
  findForBarberAtLocation(
    barberId: string,
    locationId: string
  ): Promise<import('../domain/booking').Booking[]>;
  /** Find bookings that overlap the given time range for a specific barber at a location */
  findBarberOverlaps(query: {
    barberId: string;
    locationId: string;
    start: Date;
    end: Date;
  }): Promise<import('../domain/booking').Booking[]>;
}
