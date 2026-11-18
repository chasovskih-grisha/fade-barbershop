// Адмін-ендпоінти життєвого циклу Appointment (T-042): confirm/start/complete/
// no-show/cancel над /admin/appointments. actorId — із сесії, роль примусово admin.
import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import type { CommandDto } from '../dto/appointment-command.dto';
import { adminActor } from './admin-actor';
import { runAppointmentCommand, optional, type CommandResult } from './appointment-http';

@ApiTags('admin-appointments')
@Controller('admin/appointments')
export class AdminAppointmentsController {
  constructor(private readonly lifecycle: AppointmentLifecycle) {}

  private command(run: () => Promise<void>): Promise<CommandResult> {
    return runAppointmentCommand(run);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id') id: string, @Req() req: Request): Promise<CommandResult> {
    // prettier-ignore
    return this.command(() => this.lifecycle.confirm({ appointmentId: id, ...adminActor(req) }));
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id') id: string, @Req() req: Request): Promise<CommandResult> {
    // prettier-ignore
    return this.command(() => this.lifecycle.start({ appointmentId: id, ...adminActor(req) }));
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @Req() req: Request): Promise<CommandResult> {
    // prettier-ignore
    return this.command(() => this.lifecycle.complete({ appointmentId: id, ...adminActor(req) }));
  }

  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  noShow(@Param('id') id: string, @Req() req: Request): Promise<CommandResult> {
    // prettier-ignore
    return this.command(() => this.lifecycle.markNoShow({ appointmentId: id, ...adminActor(req) }));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body() dto: CommandDto,
    @Req() req: Request
  ): Promise<CommandResult> {
    return this.command(() =>
      this.lifecycle.cancel({
        appointmentId: id,
        ...adminActor(req),
        ...optional('reason', dto.reason),
      })
    );
  }
}
