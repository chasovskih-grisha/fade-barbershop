import { Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { appointmentHttpError } from './appointment-http';
import { requireOwnAppointment } from './own-appointment';

@ApiTags('appointments')
@Controller('appointments')
export class ClientCancelController {
  constructor(
    private readonly lifecycle: AppointmentLifecycle,
    private readonly prisma: PrismaService
  ) {}

  /** Скасування свого візиту. actorId — із cookie, не з тіла. */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Req() req: Request): Promise<{ status: string }> {
    try {
      const actorId = await requireOwnAppointment(this.prisma, req, id);
      await this.lifecycle.cancel({ appointmentId: id, actorId, actorRole: 'client' });
      return { status: 'ok' };
    } catch (error) {
      appointmentHttpError(error);
    }
  }
}
