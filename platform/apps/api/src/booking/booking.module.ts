/* eslint-disable max-lines -- cohesive module (102 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { Module } from '@nestjs/common';
import { BookingController } from './infrastructure/booking.controller';
import { BookingReader } from './infrastructure/booking.reader';
import { availableSlotsProvider } from './infrastructure/available-slots.provider';
import { ServicesModule } from '../catalog/infrastructure/services.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { LocationsModule } from '../locations/infrastructure/locations.module';
import { IdentityModule } from '../identity/infrastructure/identity.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaUserRepository } from '../identity/infrastructure/prisma-adapters';
import { PrismaBarberPhotoRepository } from '../identity/infrastructure/prisma-barber-photo.repository';
import { S3PublicMediaStorage } from '../shared/media/s3-public-media-storage';
import { PrismaBookingRepository } from '../scheduling/infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from '../scheduling/infrastructure/prisma-availability.repository';
import { PrismaBarberUnavailabilityRepository } from '../scheduling/infrastructure/prisma-barber-unavailability.repository';
import { PrismaBarberServiceAssignmentRepository } from '../scheduling/infrastructure/prisma-barber-service-assignment.repository';
import { PrismaSlotPolicyRepository } from '../scheduling/infrastructure/prisma-slot-policy.repository';
import { SystemClock } from '../locations/infrastructure/system-clock';
import { PrismaLocationRepository } from '../locations/infrastructure/prisma-location.repository';
import { PrismaStaffAssignmentRepository } from '../locations/infrastructure/prisma-staff-assignment.repository';
import { PrismaServiceRepository } from '../catalog/infrastructure/prisma-service.repository';
import { PrismaAppointmentRepository } from '../scheduling/infrastructure/prisma-appointment.repository';
import { PrismaDepositPolicySettings } from '../scheduling/infrastructure/prisma-deposit-policy-settings';
import { ClientBookingsController } from '../scheduling/infrastructure/client-bookings.controller';
import { ClientAppointmentCalendarController } from '../scheduling/infrastructure/client-appointment-calendar.controller';
import { clientBookingsProvider } from '../scheduling/infrastructure/client-bookings.providers';
import { slotLockProviders } from '../scheduling/infrastructure/slot-lock.providers';
import { BookingPolicyModule } from '../booking/policy/booking-policy.module';
import { PricingModule } from '../pricing/pricing.module';

const bookingReader = {
  provide: BookingReader,
  useFactory: (...deps: any[]) =>
    new BookingReader({
      locationRepo: deps[0],
      userRepo: deps[1],
      serviceRepo: deps[2],
      staffAssignments: deps[3],
      assignments: deps[4],
      photos: deps[5],
      media: deps[6],
    }),
  inject: [
    PrismaLocationRepository,
    PrismaUserRepository,
    PrismaServiceRepository,
    PrismaStaffAssignmentRepository,
    PrismaBarberServiceAssignmentRepository,
    PrismaBarberPhotoRepository,
    S3PublicMediaStorage,
  ],
};

@Module({
  imports: [
    SchedulingModule,
    LocationsModule,
    ServicesModule,
    IdentityModule,
    BookingPolicyModule,
    PricingModule,
  ],
  providers: [
    PrismaService,
    PrismaUserRepository,
    PrismaStaffAssignmentRepository,
    // Ці адаптери не експортуються сусідніми модулями, але потрібні обом
    // фабрикам нижче — реєструємо їх явно, щоб граф BookingModule був повним.
    PrismaBarberServiceAssignmentRepository,
    PrismaBookingRepository,
    PrismaAvailabilityRepository,
    PrismaBarberUnavailabilityRepository,
    PrismaSlotPolicyRepository,
    PrismaAppointmentRepository,
    PrismaDepositPolicySettings,
    SystemClock,
    S3PublicMediaStorage,
    clientBookingsProvider,
    ...slotLockProviders,
    bookingReader,
    availableSlotsProvider,
  ],
  controllers: [BookingController, ClientBookingsController, ClientAppointmentCalendarController],
})
export class BookingModule {}
