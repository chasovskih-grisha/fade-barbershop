import { Booking, BookingConflictError } from '../domain/booking';
import { BookingRepository } from '../domain/booking-repository';
import { BarberSchedule } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { hasChairCapacity } from '../domain/chair-capacity';
import type { TimeSlotData } from '../domain/slot-validator';

export class FakeBookingRepository implements BookingRepository {
  bookings: Booking[] = [];
  constructor(private readonly mode: 'plain' | 'conflict' | 'chairs' = 'plain') {}

  async save(booking: Booking): Promise<void> {
    if (this.mode === 'plain') {
      this.bookings.push(booking);
      return;
    }
    const overlaps = this.bookings.filter(
      (existing) =>
        existing.locationId === booking.locationId &&
        existing.start < booking.end &&
        existing.end > booking.start
    );
    if (this.mode === 'chairs') {
      if (
        !hasChairCapacity({ existing: overlaps, start: booking.start, end: booking.end, chairs: 2 })
      )
        throw new BookingConflictError('No free chairs for this slot');
      if (overlaps.some((existing) => existing.barberId === booking.barberId))
        throw new BookingConflictError('Barber is already booked for this slot');
    } else {
      if (overlaps.some((existing) => existing.barberId === booking.barberId))
        throw new BookingConflictError('Barber is already booked for this slot');
      if (overlaps.length >= 2) throw new BookingConflictError('No free chairs for this slot');
    }
    this.bookings.push(booking);
  }

  async findOverlaps(locationId: string, start: Date, end: Date): Promise<Booking[]> {
    return this.bookings.filter(
      (booking) => booking.locationId === locationId && booking.start < end && booking.end > start
    );
  }
  async findAllOverlaps(start: Date, end: Date): Promise<Booking[]> {
    return this.bookings.filter((booking) => booking.start < end && booking.end > start);
  }
  async findForBarberAtLocation(barberId: string, locationId: string): Promise<Booking[]> {
    return this.bookings.filter(
      (booking) => booking.barberId === barberId && booking.locationId === locationId
    );
  }
  async findBarberOverlaps(query: {
    barberId: string;
    locationId: string;
    start: Date;
    end: Date;
  }): Promise<Booking[]> {
    const { barberId, locationId, start, end } = query;
    return this.bookings.filter(
      (booking) =>
        booking.barberId === barberId &&
        booking.locationId === locationId &&
        booking.start < end &&
        booking.end > start
    );
  }
}

export class FakeScheduleRepo {
  constructor(private readonly schedules: BarberSchedule[]) {}
  async findByBarberAndLocation(barberId: string): Promise<BarberSchedule | null> {
    return this.schedules.find((schedule) => schedule.getBarberId() === barberId) ?? null;
  }
  async listAllByLocation(): Promise<BarberSchedule[]> {
    return this.schedules;
  }
}

export function makeOpeningHours(day: number, open: string, close: string) {
  return OpeningHours.of(
    Array.from({ length: 7 }, (_, index) =>
      index === day
        ? { dayOfWeek: index, open, close, closed: false }
        : { dayOfWeek: index, open: null, close: null, closed: true }
    )
  );
}

export function slotOf(start: string, end: string, date = '2026-10-05'): TimeSlotData {
  return { date, dayOfWeek: 0, start, end };
}
