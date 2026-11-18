// HTTP стирання (T-4805): клієнт подає заявку з OTP-кодом; адмін бачить
// комплаєнс-звіт. Відповідь не розкриває, чи номер існує (однаковий 404-текст).
import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestErasure } from '../application/request-erasure';
import { ErasureOtpInvalidError, ErasureSubjectNotFoundError } from '../application/erasure.ports';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface RequestErasureDto {
  phone: string;
  code: string;
}

@ApiTags('identity')
@Controller('identity/account-erasure-requests')
export class AccountErasureController {
  constructor(private readonly requestErasure: RequestErasure) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request GDPR erasure of the account tied to this phone' })
  async create(@Body() dto: RequestErasureDto): Promise<{ id: string; status: string }> {
    try {
      const record = await this.requestErasure.execute({ phone: dto.phone, code: dto.code });
      return { id: record.id, status: record.status };
    } catch (error) {
      if (error instanceof ErasureOtpInvalidError) {
        throw new HttpException('OTP code is invalid or expired', HttpStatus.UNAUTHORIZED);
      }
      if (error instanceof ErasureSubjectNotFoundError) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }
}

@ApiTags('admin')
@Controller('admin/account-erasures')
export class AccountErasureReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('report')
  @ApiOperation({ summary: 'Compliance report: erasure requests by status (no PII)' })
  async report(): Promise<{
    byStatus: Record<string, number>;
    recent: { id: string; status: string; completedAt: string | null; objectsDeleted: number }[];
  }> {
    const grouped = await this.prisma.accountErasure.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const rows = await this.prisma.accountErasure.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: { id: true, status: true, completedAt: true, report: true },
    });
    const byStatus = Object.fromEntries(
      grouped.map((group) => [group.status, group._count._all])
    );
    return {
      byStatus,
      recent: rows.map((row) => ({
        id: row.id,
        status: row.status,
        completedAt: row.completedAt?.toISOString() ?? null,
        objectsDeleted: Number((row.report as { objectsDeleted?: number } | null)?.objectsDeleted ?? 0),
      })),
    };
  }
}
