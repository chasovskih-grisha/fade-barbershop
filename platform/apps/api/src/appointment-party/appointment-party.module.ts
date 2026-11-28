import { Module } from '@nestjs/common';
import { AppointmentPartyController } from './infrastructure/appointment-party.controller';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaAppointmentPartyRepository } from './infrastructure/prisma-appointment-party.repository';
import { CreateAppointmentParty } from './application/create-appointment-party.use-case';
import { ServicesModule } from '../catalog/infrastructure/services.module';
import { PrismaBarberServiceAssignmentRepository } from '../scheduling/infrastructure/prisma-barber-service-assignment.repository';

/**
 * Feature module for the Appointment Party bounded context.
 */
@Module({
  imports: [ServicesModule],
  controllers: [AppointmentPartyController],
  providers: [
    PrismaService,
    {
      provide: 'AppointmentPartyRepository',
      useClass: PrismaAppointmentPartyRepository,
    },
    {
      provide: 'BarberServiceAssignmentRepository',
      useClass: PrismaBarberServiceAssignmentRepository,
    },
    {
      provide: CreateAppointmentParty,
      useFactory: (repo: any, matrix: any) => new CreateAppointmentParty(repo, { matrix }),
      inject: ['AppointmentPartyRepository', 'BarberServiceAssignmentRepository'],
    },
  ],
})
export class AppointmentPartyModule {}
