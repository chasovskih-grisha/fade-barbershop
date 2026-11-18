// Провайдер залежностей адмінського створення запису (T-041) окремим файлом:
// SchedulingModule тримає список провайдерів під гейтом max-lines.
import { PrismaBookingRepository } from './prisma-booking.repository';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';
import { PrismaDepositPolicySettings } from './prisma-deposit-policy-settings';
import { ADMIN_BOOKINGS_IO } from './admin-bookings.controller';

export const adminBookingsProvider = {
  provide: ADMIN_BOOKINGS_IO,
  useFactory: (...deps: any[]) => ({
    bookingRepo: deps[0],
    scheduleRepo: deps[1],
    locationRepo: deps[2],
    services: deps[3],
    appointmentRepo: deps[4],
    depositPolicy: deps[5],
  }),
  inject: [
    PrismaBookingRepository,
    PrismaAvailabilityRepository,
    PrismaLocationRepository,
    PrismaServiceRepository,
    PrismaAppointmentRepository,
    PrismaDepositPolicySettings,
  ],
};
