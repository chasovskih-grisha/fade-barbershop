import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarExportController {
  @Get('export.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  exportIcs(
    @Query('barberId') barberId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): void {
    if (!barberId || !token) {
      res.status(400).send('Missing barberId or token');
      return;
    }
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FADE Barber//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:fade-demo-event@fade.barber',
      'DTSTAMP:20261116T180000Z',
      'DTSTART:20261116T100000Z',
      'DTEND:20261116T110000Z',
      'SUMMARY:FADE Haircut - Client Appointment',
      'DESCRIPTION:Barber ID: ' + barberId,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.send(ics);
  }
}
