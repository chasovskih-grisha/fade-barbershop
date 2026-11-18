// GET /admin/calendar (T-045 §5.1): сітка візитів день/тиждень з фільтрами
// локація/барбер/референс (REF-ADM-02). Окремий контролер — read-side
// календаря не змішується з командами життєвого циклу (LOC-гейт).

import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminCalendar, type CalendarQuery } from '../application/admin-calendar';

@ApiTags('admin-calendar')
@Controller('admin/calendar')
export class AdminCalendarController {
  constructor(private readonly readModel: AdminCalendar) {}

  @Get()
  async calendar(@Query() query: CalendarQuery): Promise<ReturnType<AdminCalendar['handle']>> {
    try {
      return await this.readModel.handle(query);
    } catch (error) {
      // prettier-ignore
      if (error instanceof Error && error.name === 'InvalidSlotError') throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      throw error;
    }
  }
}
