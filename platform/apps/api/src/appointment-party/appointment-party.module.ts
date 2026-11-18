import { Module } from '@nestjs/common';
import { AppointmentPartyController } from './infrastructure/appointment-party.controller';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaAppointmentPartyRepository } from './infrastructure/prisma-appointment-party.repository';
import { CreateAppointmentParty } from './application/create-appointment-party.use-case';
import { ServicesModule } from '../catalog/infrastructure/services.module';

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
      provide: CreateAppointmentParty,
      useFactory: (repo: any) => new CreateAppointmentParty(repo),
      inject: ['AppointmentPartyRepository'],
    },
  ],
})
export class AppointmentPartyModule {}
