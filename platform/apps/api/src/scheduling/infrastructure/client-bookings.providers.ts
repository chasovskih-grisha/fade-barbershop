// Провайдер зібраних залежностей клієнтського підтвердження (T-041) окремим
// файлом: модуль уже на межі max-lines, а набір залежностей ростиме.
import { PrismaBookingRepository } from './prisma-booking.repository';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';
import { PrismaDepositPolicySettings } from './prisma-deposit-policy-settings';
import { EvaluateOnlineBooking } from '../../booking/policy/booking-policy.module';
import { SurgePricing } from '../../pricing/pricing.module';
import { CLIENT_BOOKINGS_IO } from './client-bookings.controller';

export const clientBookingsProvider = {
  provide: CLIENT_BOOKINGS_IO,
  useFactory: (...deps: any[]) => ({
    bookingRepo: deps[0],
    scheduleRepo: deps[1],
    locationRepo: deps[2],
    services: deps[3],
    appointmentRepo: deps[4],
    depositPolicy: deps[5],
    onlineBooking: deps[6],
    surge: deps[7],
  }),
  inject: [
    PrismaBookingRepository,
    PrismaAvailabilityRepository,
    PrismaLocationRepository,
    PrismaServiceRepository,
    PrismaAppointmentRepository,
    PrismaDepositPolicySettings,
    EvaluateOnlineBooking,
    SurgePricing,
  ],
};
