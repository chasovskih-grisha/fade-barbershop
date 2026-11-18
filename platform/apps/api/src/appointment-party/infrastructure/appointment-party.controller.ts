import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAppointmentParty } from '../application/create-appointment-party.use-case';
import { AppointmentPartyCreated } from '../domain/appointment-party.events';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import type { CreateAppointmentPartyDto } from './appointment-party.dto';
import { assertPartyReady, toPartyHttpError } from './appointment-party-guards';

export type { CreateAppointmentPartyDto } from './appointment-party.dto';

@Controller('admin/appointment-parties')
export class AppointmentPartyController {
  constructor(
    private readonly useCase: CreateAppointmentParty,
    private readonly services: PrismaServiceRepository,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAppointmentPartyDto): Promise<{ id: string }> {
    await assertPartyReady(this.prisma, dto);
    const service = await this.services.findById(dto.serviceId);
    const price = await this.services.find(dto.serviceId, dto.locationId);
    if (!service?.active || !price?.active || !price.id)
      throw new HttpException('Service is not available at this location', HttpStatus.NOT_FOUND);
    try {
      const result: AppointmentPartyCreated = await this.useCase.execute({
        locationId: dto.locationId,
        serviceId: dto.serviceId,
        date: new Date(dto.date),
        mode: dto.mode,
        barberIds: dto.barberIds,
        slots: dto.slots.map((s) => ({ start: new Date(s.start), end: new Date(s.end) })),
        partyLegs: dto.partyLegs,
        agreedPriceId: price.id,
        agreedPrice: price.amount,
      });
      return { id: result.appointmentParty.id };
    } catch (error) {
      throw toPartyHttpError(error);
    }
  }
}
