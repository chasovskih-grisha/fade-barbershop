import { Module } from '@nestjs/common';
import { IdentityModule } from '../../identity/infrastructure/identity.module';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { AssignStaffHandler } from '../application/assign-staff';
import { ListStaffHandler } from '../application/list-staff';
import { UnassignStaffHandler } from '../application/unassign-staff';
import { PrismaOutboxPublisher } from './prisma-locations-outbox';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaLocationRepository } from './prisma-location.repository';
import { PrismaStaffAssignmentRepository } from './prisma-staff-assignment.repository';
import { AdminStaffController, STAFF_CONTROLLER_DEPS } from './admin-staff.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminStaffController],
  providers: [
    PrismaService,
    PrismaUnitOfWork,
    PrismaLocationRepository,
    PrismaStaffAssignmentRepository,
    PrismaOutboxPublisher,
    SystemClock,
    UuidIdGenerator,
    {
      provide: AssignStaffHandler,
      useFactory: (...deps: any[]) =>
        new AssignStaffHandler({
          assignments: deps[0],
          locations: deps[1],
          outbox: deps[2],
          clock: deps[3],
          ids: deps[4],
          uow: deps[5],
        }),
      inject: [
        PrismaStaffAssignmentRepository,
        PrismaLocationRepository,
        PrismaOutboxPublisher,
        SystemClock,
        UuidIdGenerator,
        PrismaUnitOfWork,
      ],
    },
    {
      provide: UnassignStaffHandler,
      useFactory: (...deps: any[]) =>
        new UnassignStaffHandler({
          assignments: deps[0],
          outbox: deps[1],
          clock: deps[2],
          uow: deps[3],
        }),
      inject: [
        PrismaStaffAssignmentRepository,
        PrismaOutboxPublisher,
        SystemClock,
        PrismaUnitOfWork,
      ],
    },
    {
      provide: ListStaffHandler,
      useFactory: (...deps: any[]) => new ListStaffHandler(deps[0]),
      inject: [PrismaStaffAssignmentRepository],
    },
    {
      provide: STAFF_CONTROLLER_DEPS,
      useFactory: (...deps: any[]) => ({
        assign: deps[0],
        unassign: deps[1],
        list: deps[2],
        users: deps[3],
      }),
      inject: [AssignStaffHandler, UnassignStaffHandler, ListStaffHandler, PrismaUserRepository],
    },
  ],
})
export class StaffModule {}
