// GET /appointments/:id/book-again — намір повторного запису (T-4617a).
// Сесія клієнта (cookie fadoidx). Чужий/незавершений візит — 404.

import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookAgainIntentReader, type BookAgainIntent } from '../application/book-again-intent';
import { appointmentHttpError } from './appointment-http';
import { requireOwnAppointment } from './own-appointment';

@ApiTags('appointments')
@Controller('appointments')
export class ClientBookAgainController {
  constructor(
    private readonly bookAgain: BookAgainIntentReader,
    private readonly prisma: PrismaService
  ) {}

  @Get(':id/book-again')
  async intent(@Param('id') id: string, @Req() req: Request): Promise<BookAgainIntent> {
    try {
      const clientId = await requireOwnAppointment(this.prisma, req, id);
      return await this.bookAgain.handle(id, clientId);
    } catch (error) {
      appointmentHttpError(error);
    }
  }
}
