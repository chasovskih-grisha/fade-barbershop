import { Controller, Get, Header, Logger, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { buildIcs } from './calendar-ics';

interface ExportQuery {
  bookingId?: string;
  barberId?: string;
  token?: string;
}

@ApiTags('calendar')
@Controller('calendar')
export class CalendarExportController {
  private readonly logger = new Logger(CalendarExportController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('export.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async exportIcs(@Query() query: ExportQuery, @Res() res: Response): Promise<void> {
    try {
      const bookingId = await this.resolveBookingId(query);
      if (!bookingId) {
        res.status(400).send('Missing bookingId or barberId+token');
        return;
      }

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
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
        },
      });
      if (!booking) {
        res.status(404).send('Booking not found');
        return;
      }

      const location = await this.prisma.location.findUnique({
        where: { id: booking.locationId },
        select: { name: true, address: true },
      });
      res.send(buildIcs(booking, location));
    } catch (error) {
      this.logger.error(`Calendar ICS export error: ${String(error)}`);
      res.status(500).send('Internal server error');
    }
  }

  /** Explicit id wins; otherwise the latest booking of the barber is used. */
  private async resolveBookingId(query: ExportQuery): Promise<string> {
    if (query.bookingId) return query.bookingId;
    if (query.barberId && query.token) {
      const latest = await this.prisma.booking.findFirst({
        where: { barberId: query.barberId },
        orderBy: { start: 'desc' },
        select: { id: true },
      });
      return latest?.id ?? '';
    }
    return '';
  }
}
