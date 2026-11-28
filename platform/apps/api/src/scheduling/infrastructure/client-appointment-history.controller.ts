// Історія статусів візиту клієнта: окремий контролер, бо йому потрібні лише
// Prisma (перевірка власника) та репозиторій історії — командні use cases тут
// не беруть участі.

import { Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { requireOwnAppointment } from './own-appointment';
import {
  PrismaAppointmentHistoryRepository,
  type AppointmentHistoryRecord,
} from './prisma-appointment-history.repository';

@ApiTags('appointments')
@Controller('appointments')
export class ClientAppointmentHistoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyRepository: PrismaAppointmentHistoryRepository
  ) {}

  @Post(':id/history')
  @HttpCode(HttpStatus.OK)
  async history(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<{ items: AppointmentHistoryRecord[]; total: number }> {
    await requireOwnAppointment(this.prisma, req, id);
    const result = await this.historyRepository.findByAppointmentId(id, { limit: 50, offset: 0 });
    return { items: result.items, total: result.total };
  }
}
