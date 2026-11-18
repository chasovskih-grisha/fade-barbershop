// GET /booking/appointments — «Мої візити» кабінету (web-cabinet-screens §3).
// Cookie fadoidx, канал web. Чужі записи не віддаємо.

import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ListClientAppointments, type ClientAppointmentView } from '../application/list-client-appointments';
import { webClientId } from './client-web-session';

@ApiTags('booking')
@Controller('booking/appointments')
export class ClientAppointmentListController {
  constructor(
    private readonly list: ListClientAppointments,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async mine(@Req() req: Request): Promise<ClientAppointmentView[]> {
    return this.list.handle(await webClientId(req, this.prisma, true));
  }
}
