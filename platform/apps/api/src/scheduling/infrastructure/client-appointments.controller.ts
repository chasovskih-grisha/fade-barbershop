// Клієнтські команди Appointment: той самий use case, що адмінський,
// але actorRole примусово 'client', а actorId — із cookie-сесії.
// Тіло запиту не може видати клієнта за іншого.

import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import { appointmentHttpError } from './appointment-http';
import { requireOwnAppointment } from './own-appointment';

type ClientCommandDto = {
  date?: string;
  start?: string;
  end?: string;
  referenceId?: string;
  comment?: string;
};

@ApiTags('appointments')
@Controller('appointments')
export class ClientAppointmentsController {
  constructor(
    private readonly rescheduleUseCase: RescheduleAppointment,
    private readonly referenceUseCase: SetAppointmentReference,
    private readonly prisma: PrismaService
  ) {}

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  async reschedule(
    @Param('id') id: string,
    @Body() dto: ClientCommandDto,
    @Req() req: Request
  ): Promise<{ status: string }> {
    return this.run(async () => {
      const when = rescheduleWhen(dto);
      const actorId = await requireOwnAppointment(this.prisma, req, id);
      await this.rescheduleUseCase.handle({
        appointmentId: id,
        actorId,
        actorRole: 'client',
        ...when,
      });
    });
  }

  @Post(':id/reference')
  @HttpCode(HttpStatus.OK)
  async setReference(
    @Param('id') id: string,
    @Body() dto: ClientCommandDto,
    @Req() req: Request
  ): Promise<{ status: string }> {
    return this.run(async () => {
      const actorId = await requireOwnAppointment(this.prisma, req, id);
      await this.referenceUseCase.handle({
        appointmentId: id,
        actorId,
        actorRole: 'client',
        ...(dto.referenceId === undefined ? {} : { referenceId: dto.referenceId }),
        ...(dto.comment === undefined ? {} : { comment: dto.comment }),
      });
    });
  }

  private async run(action: () => Promise<void>): Promise<{ status: string }> {
    try {
      await action();
      return { status: 'ok' };
    } catch (error) {
      appointmentHttpError(error);
    }
  }
}

function rescheduleWhen(dto: ClientCommandDto): { date: string; start: string; end: string } {
  if (!dto.date || !dto.start || !dto.end) {
    throw new HttpException('A new date is required to reschedule', HttpStatus.BAD_REQUEST);
  }
  return { date: dto.date, start: dto.start, end: dto.end };
}
