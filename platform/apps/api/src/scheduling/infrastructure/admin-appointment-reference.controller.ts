// Адмін-ендпоінт референсу зачіски (T-043): POST /admin/appointments/:id/reference.
import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import type { CommandDto } from '../dto/appointment-command.dto';
import { adminActor } from './admin-actor';
import { runAppointmentCommand, optional, type CommandResult } from './appointment-http';

@ApiTags('admin-appointments')
@Controller('admin/appointments')
export class AdminAppointmentReferenceController {
  constructor(private readonly referenceUseCase: SetAppointmentReference) {}

  @Post(':id/reference')
  @HttpCode(HttpStatus.OK)
  setReference(
    @Param('id') id: string,
    @Body() dto: CommandDto,
    @Req() req: Request
  ): Promise<CommandResult> {
    return runAppointmentCommand(() =>
      this.referenceUseCase.handle({
        appointmentId: id,
        ...adminActor(req),
        ...optional('referenceId', dto.referenceId),
        ...optional('comment', dto.comment),
      })
    );
  }
}
