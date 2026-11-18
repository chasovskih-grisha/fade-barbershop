// appoint() — крок бронювання (T-042a): після успішного save Booking
// створюється агрегат Appointment з подією booked. Виділено за ADR 0019.

import { Appointment } from '../domain/appointment.aggregate';
import type { AppointmentRepository } from '../domain/appointment-repository';
import type { Booking } from '../domain/booking';

const hhmm = (date: Date): string => date.toISOString().slice(11, 16);

export async function appoint(
  appointments: AppointmentRepository,
  booking: Booking
): Promise<void> {
  const appointment = Appointment.book(
    {
      id: booking.id,
      bookingId: booking.id,
      locationId: booking.locationId,
      barberId: booking.barberId,
      start: hhmm(booking.start),
      end: hhmm(booking.end),
    },
    new Date()
  );
  await appointments.save(appointment);
}
