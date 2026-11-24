// T-230/SCH-ADM-02: журнал мережі з фільтром по барберу. /admin/* захищає
// глобальний AdminSessionGuard.
import { Controller, Get, Query } from '@nestjs/common';
import { PrismaScheduleChangeLogRepository } from './prisma-schedule-change-log.repository';

@Controller('admin/schedule/change-log')
export class AdminScheduleLogController {
  constructor(private readonly changeLog: PrismaScheduleChangeLogRepository) {}

  @Get()
  async list(@Query('barberId') barberId?: string) {
    const items = barberId
      ? await this.changeLog.listByBarber(barberId)
      : await this.changeLog.listAll();
    return { items, total: items.length };
  }
}
