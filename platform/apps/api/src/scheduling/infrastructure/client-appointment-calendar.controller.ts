import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { buildIcs } from './calendar-ics';
import { webClientId } from './client-web-session';

/**
 * T-4446a: `.ics`-фід **власного** візиту для кабінету клієнта.
 *
 * Дозвіл — клієнтська сесія (`fadoidx`), а не id візиту: чужий id віддає 404,
 * як і решта клієнтських маршрутів (не підтверджуємо існування). Файл
 * збирається з поточного рядка візиту, тож перенесення/скасування видно в
 * наступному завантаженні за тим самим `UID`.
 */
@ApiTags('booking')
@Controller('booking/appointments')
export class ClientAppointmentCalendarController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/calendar.ics')
  async exportIcs(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<void> {
    const clientId = await webClientId(request, this.prisma, true);
    const booking = await this.prisma.booking.findFirst({
      where: { clientId, OR: [{ appointmentId: id }, { id }] },
      select: {
        id: true,
        start: true,
        end: true,
        barberId: true,
        locationId: true,
        agreedPrice: true,
        finalPrice: true,
        appliedDiscounts: true,
        haircutReferenceId: true,
        status: true,
        version: true,
      },
    });
    if (!booking) {
      response.status(404).send('Booking not found');
      return;
    }

    const location = await this.prisma.location.findUnique({
      where: { id: booking.locationId },
      select: { name: true, address: true },
    });

    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="fade-${booking.id}.ics"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(buildIcs(booking, location));
  }
}
