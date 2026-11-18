import { Module } from '@nestjs/common';
import { BookingController } from './infrastructure/booking.controller';
import { BookingReader } from './infrastructure/booking.reader';
import { AvailableSlots } from './infrastructure/available-slots';
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
import { PrismaBarberServiceAssignmentRepository } from '../scheduling/infrastructure/prisma-barber-service-assignment.repository';
import { PrismaSlotPolicyRepository } from '../scheduling/infrastructure/prisma-slot-policy.repository';
import { SystemClock } from '../locations/infrastructure/system-clock';
import { PrismaLocationRepository } from '../locations/infrastructure/prisma-location.repository';
import { PrismaStaffAssignmentRepository } from '../locations/infrastructure/prisma-staff-assignment.repository';
import { PrismaServiceRepository } from '../catalog/infrastructure/prisma-service.repository';

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

const availableSlots = {
  provide: AvailableSlots,
  useFactory: (...deps: any[]) =>
    new AvailableSlots({
      bookingRepo: deps[0],
      scheduleRepo: deps[1],
      locationRepo: deps[2],
      userRepo: deps[3],
      serviceRepo: deps[4],
      assignmentRepo: deps[5],
      slotPolicyRepo: deps[6],
      clock: deps[7],
    }),
  inject: [
    PrismaBookingRepository,
    PrismaAvailabilityRepository,
    PrismaLocationRepository,
    PrismaUserRepository,
    PrismaServiceRepository,
    PrismaBarberServiceAssignmentRepository,
    PrismaSlotPolicyRepository,
    SystemClock,
  ],
};

@Module({
  imports: [SchedulingModule, LocationsModule, ServicesModule, IdentityModule],
  providers: [
    PrismaService,
    PrismaUserRepository,
    PrismaStaffAssignmentRepository,
    S3PublicMediaStorage,
    bookingReader,
    availableSlots,
  ],
  controllers: [BookingController],
})
export class BookingModule {}
