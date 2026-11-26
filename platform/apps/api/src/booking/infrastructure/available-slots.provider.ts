import { AvailableSlots } from './available-slots';
import { PrismaBookingRepository } from '../../scheduling/infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from '../../scheduling/infrastructure/prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import { PrismaBarberServiceAssignmentRepository } from '../../scheduling/infrastructure/prisma-barber-service-assignment.repository';
import { PrismaSlotPolicyRepository } from '../../scheduling/infrastructure/prisma-slot-policy.repository';
import { SystemClock } from '../../locations/infrastructure/system-clock';
import { DepositHoldService } from '../../scheduling/application/deposit-hold.service';

export const availableSlotsProvider = {
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
      depositHolds: deps[8],
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
    DepositHoldService,
  ],
};
