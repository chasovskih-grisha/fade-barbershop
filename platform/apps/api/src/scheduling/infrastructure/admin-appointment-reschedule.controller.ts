// Адмін-перенесення запису (T-4533): POST /admin/appointments/:id/reschedule.
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
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import type { CommandDto } from '../dto/appointment-command.dto';
import { adminActor } from './admin-actor';
import { runAppointmentCommand, type CommandResult } from './appointment-http';

@ApiTags('admin-appointments')
@Controller('admin/appointments')
export class AdminAppointmentRescheduleController {
  constructor(private readonly rescheduleUseCase: RescheduleAppointment) {}

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  reschedule(
    @Param('id') id: string,
    @Body() dto: CommandDto,
    @Req() req: Request
  ): Promise<CommandResult> {
    if (!dto.date)
      throw new HttpException('A new date is required to reschedule', HttpStatus.BAD_REQUEST);
    const when = { date: dto.date, start: dto.start ?? '', end: dto.end ?? '' };
    return runAppointmentCommand(() =>
      this.rescheduleUseCase.handle({ appointmentId: id, ...adminActor(req), ...when })
    );
  }
}
