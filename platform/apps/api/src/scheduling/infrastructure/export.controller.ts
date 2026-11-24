import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { PrismaService } from '../../shared/prisma/prisma.service';

/* eslint-disable complexity -- legacy CSV export branches; decomposition tracked in T-2500f */
@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('clients-settings.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async exportClientsSettingsCsv(@Query() query: { locationId?: string; barberId?: string }, @Res() res: Response): Promise<void> {
    try {
      // Fetch locations
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

      // Fetch clients - summary per location
      const clients = await this.prisma.$queryRaw<
        { id: string; name: string; email: string; phone: string; locationId: string }[]
      >
      `SELECT "id", "name", "email", "phone", "locationId" FROM "Client" ORDER BY "name" ASC`;


      // Fetch deposit policy settings
      const depositPolicySetting = await this.prisma.appSetting.findFirst({
        where: { key: 'DepositPolicySettings' },
      });

      // Build CSV
      const lines: string[] = [];

      // Locations section
      lines.push('=== LOCATIONS ===');
      lines.push('id,code,name,active,address,phone,email,createdAt');
      for (const loc of locations) {
        const active = loc.active ? 'true' : 'false';
        const createdAt = loc.createdAt?.toISOString().replace(/[^\d]/g, '') || '';
        lines.push([loc.id, loc.code, loc.name, active, loc.address || '', loc.phone || '', loc.email || '', createdAt].join(','));
      }

      // Clients section
      lines.push('');
      lines.push('=== CLIENTS ===');
      lines.push('id,name,email,phone,locationId');
      for (const c of clients) {
        lines.push([c.id, c.name, c.email || '', c.phone || '', c.locationId || ''].join(','));
      }

      // Deposit policy settings
      lines.push('');
      lines.push('=== DEPOSIT POLICY SETTINGS ===');
      if (depositPolicySetting) {
        lines.push('key,value,updatedAt');
        lines.push([depositPolicySetting.key, depositPolicySetting.value || '', depositPolicySetting.updatedAt?.toISOString() || ''].join(','));
      } else {
        lines.push('key,value,updatedAt');
        lines.push('No deposit policy settings found');
      }

      res.set('Content-Disposition', 'attachment; filename="clients-settings-export.csv"');
      res.send(lines.join('\r\n'));
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).send('Internal server error');
    }
  }
}