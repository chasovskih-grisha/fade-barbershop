/* eslint-disable max-lines -- cohesive module (194 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4560: клієнтська HTTP-поверхня відвідуваності.
// Тонкий шар над AttendanceManagementService: ті самі правила, інший набір
// маршрутів для мобільного клієнта (ідентифікатор запису — у шляху).
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttendanceManagementService } from './attendance-management.service';
import {
  AttendanceError,
  type AttendanceRecord,
  type CancellationActorRole,
  type ClientAttendanceHistory,
  type NoShowPolicy,
  type NoShowStatsView,
} from '../domain/attendance-management';

function mapError(error: unknown): never {
  if (error instanceof AttendanceError) {
    if (error.message.includes('not found')) throw new NotFoundException(error.message);
    throw new BadRequestException(error.message);
  }
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}

@Controller('attendance')
export class AttendanceManagementController {
  constructor(private readonly service: AttendanceManagementService) {}

  /** Записи відвідуваності з фільтром за локацією/клієнтом. */
  @Get('records')
  async listRecords(
    @Query('locationId') locationId?: string,
    @Query('clientId') clientId?: string
  ): Promise<AttendanceRecord[]> {
    return this.service.listRecords({
      ...(locationId === undefined ? {} : { locationId }),
      ...(clientId === undefined ? {} : { clientId }),
    });
  }

  /** Скасування візиту: дані візиту приходять у тілі, `id` — appointmentId. */
  @Post('records/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRecord(
    @Param('id') id: string,
    @Body()
    body: {
      clientId: string;
      barberId: string;
      locationId: string;
      reason: { code: string; note?: string };
      actorRole: CancellationActorRole;
      appointmentStart: string;
      by: string;
      serviceId?: string;
      channel?: string;
      at?: string;
    }
  ): Promise<AttendanceRecord> {
    try {
      const start = parseAt(body.appointmentStart);
      return await this.service.recordCancellation({
        appointmentId: id,
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
        appointmentStart: start ?? new Date(),
        by: body.by,
        ...(parseAt(body.at) === undefined ? {} : { at: parseAt(body.at) as Date }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Позначка no-show для візиту. */
  @Post('records/:id/no-show')
  @HttpCode(HttpStatus.OK)
  async recordNoShow(
    @Param('id') id: string,
    @Body()
    body: {
      clientId: string;
      barberId: string;
      locationId: string;
      actorRole?: CancellationActorRole | null;
      appointmentStart: string;
      by: string;
      serviceId?: string;
      channel?: string;
      reason?: { code: string; note?: string };
      at?: string;
    }
  ): Promise<AttendanceRecord> {
    try {
      return await this.service.recordNoShow({
        appointmentId: id,
        clientId: body.clientId,
        barberId: body.barberId,
        locationId: body.locationId,
        serviceId: body.serviceId ?? null,
        channel: body.channel ?? null,
        reason: body.reason
          ? {
              code: body.reason.code,
              ...(body.reason.note === undefined ? {} : { note: body.reason.note }),
            }
          : null,
        actorRole: body.actorRole ?? null,
        appointmentStart: parseAt(body.appointmentStart) ?? new Date(),
        by: body.by,
        ...(parseAt(body.at) === undefined ? {} : { at: parseAt(body.at) as Date }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Статистика no-show для клієнта (за замовчуванням — 30 днів). */
  @Get('records/:id/stats')
  async getStats(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<NoShowStatsView> {
    try {
      return await this.service.statsForClient(id, {
        ...(parseAt(from) === undefined ? {} : { from: parseAt(from) as Date }),
        ...(parseAt(to) === undefined ? {} : { to: parseAt(to) as Date }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Виправдати no-show: запис лишається, але не рахується в статистиці. */
  @Post('records/:id/excuse')
  @HttpCode(HttpStatus.OK)
  async excuseNoShow(
    @Param('id') id: string,
    @Body() body: { by: string; reason: string; at?: string }
  ): Promise<AttendanceRecord> {
    try {
      return await this.service.excuse(id, {
        by: body.by,
        reason: body.reason,
        ...(parseAt(body.at) === undefined ? {} : { at: parseAt(body.at) as Date }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Зняти штраф за скасування. */
  @Post('records/:id/waive')
  @HttpCode(HttpStatus.OK)
  async waiveCancellationFee(
    @Param('id') id: string,
    @Body() body: { by: string; reason: string; at?: string }
  ): Promise<AttendanceRecord> {
    try {
      return await this.service.waiveFee(id, {
        by: body.by,
        reason: body.reason,
        ...(parseAt(body.at) === undefined ? {} : { at: parseAt(body.at) as Date }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Активне рішення адміна щодо блокування онлайн-запису клієнта. */
  @Get('records/:id/restriction')
  async getRestriction(@Param('id') id: string) {
    return this.service.getRestriction(id);
  }

  /** Політика no-show локації (для адмінки). */
  @Get('policy')
  async policy(
    @Query('locationId') locationId: string,
    @Query('serviceId') serviceId?: string
  ): Promise<NoShowPolicy> {
    return this.service.policy({
      locationId,
      ...(serviceId === undefined ? {} : { serviceId }),
    });
  }

  /** Історія клієнта для екрана «відвідуваність». */
  @Get('clients/:clientId/history')
  async clientHistory(@Param('clientId') clientId: string): Promise<ClientAttendanceHistory> {
    return this.service.history(clientId);
  }
}
