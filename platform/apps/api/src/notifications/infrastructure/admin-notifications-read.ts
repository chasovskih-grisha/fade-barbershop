// AdminNotificationReadController — перегляд журналу сповіщень в адмінці (T-4608)
// Надає список та фільтрацію останніх відправлених/пропущених сповіщень.

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../shared/prisma/prisma.service';

@ApiTags('admin-notifications')
@Controller('admin/notifications')
export class AdminNotificationReadController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('records')
  @ApiOperation({ summary: 'Переглянути журнал відправлених сповіщень' })
  async listRecords(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 50;
    const where: { status?: string; type?: string } = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return this.prisma.notificationRecord.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: isNaN(take) ? 50 : Math.min(take, 200),
    });
  }
}
