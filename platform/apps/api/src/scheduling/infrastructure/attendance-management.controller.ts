/* eslint-disable max-lines -- cohesive module (197 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4560: HTTP-поверхня керування no-show та скасуваннями.
// Endpoints: адмін змінює політику локації/послуги, кількість візитів для
// ризику, міняє статус винятку/відкликання депозиту; адмін/барбер створюють
// скасування/no-show, адмін можуть виправлювати, відмикати штраф.
import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AttendanceManagementService,
  type NoShowPolicy,
  type AttendanceRecord,
} from '../application/attendance-management.service';
import type { ClientAttendanceHistory, NoShowStatsView } from '../domain/attendance-management';
import { AttendanceError } from '../domain/attendance-management';

function mapError(error: unknown): never {
  if (error instanceof AttendanceError) {
    if (error.message.includes('not found')) throw new NotFoundException(error.message);
    if (error.message.includes('already excused')) throw new ConflictException(error.message);
    if (error.message.includes('already waived')) throw new ConflictException(error.message);
    throw new BadRequestException(error.message);
  }
  if (error instanceof ForbiddenException) throw error;
  if (error instanceof ConflictException) throw error;
  if (error instanceof BadRequestException) throw error;
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceManagementController {
  constructor(private readonly attendance: AttendanceManagementService) {}

  @Post('cancel')
  @ApiOperation({ summary: 'Скасувати візит з причиною' })
  async cancel(
    @Body()
    body: {
      appointmentId: string;
      clientId: string;
      barberId: string;
      locationId: string;
      reason: { code: string; note?: string };
      actorRole: 'client' | 'barber' | 'admin';
      appointmentStart: string;
      by: string;
      serviceId?: string;
      channel?: string;
    }
  ): Promise<AttendanceRecord> {
    try {
      return await this.attendance.recordCancellation({
        appointmentId: body.appointmentId,
        clientId: body.clientId,
        barberId: body.barberId,
        locationId: body.locationId,
        serviceId: body.serviceId ?? null,
        channel: body.channel ?? null,
        reason: {
          code: body.reason.code,
          ...(body.reason.note === undefined ? {} : { note: body.reason.note }),
        },
        actorRole: body.actorRole,
        appointmentStart: parseAt(body.appointmentStart) ?? new Date(),
        by: body.by,
        at: new Date(),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Post('no-show')
  @ApiOperation({ summary: 'Позначити no-show за причиною' })
  async noShow(
    @Body()
    body: {
      appointmentId: string;
      clientId: string;
      barberId: string;
      locationId: string;
      reason?: { code: string; note?: string };
      actorRole?: 'client' | 'barber' | 'admin';
      appointmentStart: string;
      by: string;
      serviceId?: string;
      channel?: string;
    }
  ): Promise<AttendanceRecord> {
    try {
      return await this.attendance.recordNoShow({
        appointmentId: body.appointmentId,
        clientId: body.clientId,
        barberId: body.barberId,
        locationId: body.locationId,
        ...(body.serviceId === undefined ? {} : { serviceId: body.serviceId }),
        ...(body.channel === undefined ? {} : { channel: body.channel }),
        ...(body.reason === undefined
          ? {}
          : {
              reason: {
                code: body.reason.code,
                ...(body.reason.note === undefined ? {} : { note: body.reason.note }),
              },
            }),
        actorRole: body.actorRole ?? null,
        appointmentStart: parseAt(body.appointmentStart) ?? new Date(),
        by: body.by,
        at: new Date(),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Get('stats')
  @ApiQuery({ name: 'from', required: false, description: 'Start date ISO' })
  @ApiQuery({ name: 'to', required: false, description: 'End date ISO' })
  @ApiOperation({ summary: 'Статистика no-show та скасувань' })
  async stats(@Query('from') from?: string, @Query('to') to?: string): Promise<NoShowStatsView> {
    try {
      const fromDate = from ? (parseAt(from) ?? new Date()) : new Date();
      const toDate = to ? (parseAt(to) ?? new Date()) : new Date();
      return await this.attendance.stats({ from: fromDate, to: toDate });
    } catch (error) {
      mapError(error);
    }
  }

  @Post('excuse')
  @ApiOperation({ summary: 'Виправлювати no-show (neraхується в статистику)' })
  async excuse(
    @Param('recordId') recordId: string,
    @Body() body: { by: string; reason: string; at?: string }
  ): Promise<AttendanceRecord> {
    try {
      const at = parseAt(body.at);
      return await this.attendance.excuse(recordId, {
        by: body.by,
        reason: body.reason,
        ...(at === undefined ? {} : { at }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Post('waive-fee')
  @ApiOperation({ summary: 'Видалити штраф з скасування' })
  async waiveFee(
    @Param('recordId') recordId: string,
    @Body() body: { by: string; reason: string; at?: string }
  ): Promise<AttendanceRecord> {
    try {
      const at = parseAt(body.at);
      return await this.attendance.waiveFee(recordId, {
        by: body.by,
        reason: body.reason,
        ...(at === undefined ? {} : { at }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Post('set-policy')
  @ApiOperation({ summary: 'Встановити політику локації/послуги' })
  async setPolicy(@Body() body: Partial<NoShowPolicy>): Promise<NoShowPolicy> {
    try {
      return await this.attendance.setPolicy(body);
    } catch (error) {
      mapError(error);
    }
  }

  @Post('restriction/:clientId')
  @ApiOperation({ summary: 'Зняти / повернути блокування онлайн-запису' })
  async restriction(
    @Param('clientId') clientId: string,
    @Body() body: { lifted: boolean; by: string; note: string; at?: string }
  ): Promise<ClientAttendanceHistory> {
    try {
      await this.attendance.setRestriction(clientId, {
        lifted: body.lifted,
        by: body.by,
        note: body.note,
        ...(parseAt(body.at) === undefined ? {} : { at: parseAt(body.at) as Date }),
      });
      return await this.attendance.history(clientId);
    } catch (error) {
      mapError(error);
    }
  }
}
