// Візити барбера — читання власних записів за сесією (ClientSessionGuard).
// Повертає той самий read-модель, що «Мої візити» клієнта, але фільтром
// barberId = session.userId. Адмін-адже не тут: адмін бачить все у календарі.
// Обмеження фронту: список не містить депозит-утримання (hold) — це окремий
// запит /barber/payments/bookings/:id/onsite, який кладе барбер-платежний контролер.

import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import { ListClientAppointments } from '../application/list-client-appointments';

@Controller('barber')
export class BarberAppointmentsController {
  constructor(private readonly list: ListClientAppointments) {}

  @Get('appointments')
  async own(@Req() req: Request) {
    const session = clientSessionOf(req);
    if (!session) return { visits: [] };
    return { visits: await this.list.handle(session.userId, 'barber') };
  }
}
