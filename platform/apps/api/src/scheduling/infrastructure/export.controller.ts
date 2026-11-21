import { Controller, Get, Header, Logger, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { buildClientsSettingsCsv } from './clients-settings-csv';

interface ExportQuery {
  locationId?: string;
  barberId?: string;
}

@ApiTags('export')
@Controller('export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('clients-settings.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async exportClientsSettingsCsv(@Query() query: ExportQuery, @Res() res: Response): Promise<void> {
    try {
      const locations = await this.prisma.location.findMany({
        where: query.locationId ? { id: query.locationId } : {},
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          active: true,
          address: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      });
      const clients = await this.prisma.$queryRaw<
        { id: string; name: string; email: string; phone: string; locationId: string }[]
      >`SELECT "id", "name", "email", "phone", "locationId" FROM "Client" ORDER BY "name" ASC`;
      const setting = await this.prisma.appSetting.findFirst({
        where: { key: 'DepositPolicySettings' },
      });

      res.set('Content-Disposition', 'attachment; filename="clients-settings-export.csv"');
      res.send(buildClientsSettingsCsv(locations, clients, setting));
    } catch (error) {
      this.logger.error(`CSV export error: ${String(error)}`);
      res.status(500).send('Internal server error');
    }
  }
}
