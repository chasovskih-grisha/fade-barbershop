/* eslint-disable max-lines, max-params -- T-230: one guarded route group; the six collaborators are the self-service surface. */
// T-230: HTTP-поверхня self-service графіка барбера. Барбер ідентифікується
// сесією mobile (ClientSessionGuard), не тілом запиту; право редагування —
// прапорець selfSchedule (SCH-001). Конфлікт із візитами повертає 409 зі
// списком, а не зберігає графік (SCH-004).
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import { EditOwnScheduleHandler } from '../application/edit-own-schedule';
import { ListAvailabilityHandler } from '../application/list-availability';
import { MarkBarberUnavailable } from '../application/mark-barber-unavailable.use-case';
import {
  InvalidScheduleInputError,
  ScheduleConflictError,
  type AvailabilityWindowData,
} from '../domain/availability';
import { ScheduleNotAllowedError } from '../domain/barber-self-service';
import { InvalidUnavailabilityError } from '../domain/barber-unavailability';
import { historyForBarber } from '../domain/schedule-change-log';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaSchedulePolicyRepository } from './prisma-schedule-policy.repository';
import { PrismaScheduleChangeLogRepository } from './prisma-schedule-change-log.repository';

@Controller('barber/schedule')
@UseGuards(ClientSessionGuard)
export class BarberScheduleController {
  constructor(
    private readonly edit: EditOwnScheduleHandler,
    private readonly list: ListAvailabilityHandler,
    private readonly policies: PrismaSchedulePolicyRepository,
    private readonly changeLog: PrismaScheduleChangeLogRepository,
    private readonly markUnavailable: MarkBarberUnavailable,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Локації самого барбера (T-4616b): екран «не вийду» мусить знати, де він
   * працює, інакше клієнт вгадує `locationId` навмання.
   */
  @Get()
  async locations(@Req() req: Request) {
    const barberId = await this.barberOf(req);
    const assignments = await this.prisma.staffAssignment.findMany({
      where: { barberId },
      select: { locationId: true },
    });
    if (assignments.length === 0) return { barberId, locations: [] };
    const locations = await this.prisma.location.findMany({
      where: { id: { in: assignments.map((assignment) => assignment.locationId) } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { barberId, locations };
  }

  @Get(':locationId')
  async view(@Param('locationId') locationId: string, @Req() req: Request) {
    const barberId = await this.barberOf(req);
    const [schedule, policy, changes] = await Promise.all([
      this.list.listByBarberAndLocation(barberId, locationId),
      this.policies.findForBarber(barberId),
      this.changeLog.listByBarber(barberId),
    ]);
    return {
      barberId,
      locationId,
      windows: schedule?.getWindows() ?? [],
      version: schedule?.getVersion() ?? 0,
      canEdit: policy?.selfService ?? false,
      history: historyForBarber(changes, barberId).filter(
        (change) => change.locationId === locationId
      ),
    };
  }

  @Put(':locationId')
  @HttpCode(HttpStatus.OK)
  async save(
    @Param('locationId') locationId: string,
    @Body() body: { windows: AvailabilityWindowData[] },
    @Req() req: Request
  ): Promise<{ version: number }> {
    const barberId = await this.barberOf(req);
    await this.assertAssigned(barberId, locationId);
    const result = await this.mapErrors(() =>
      this.edit.handle({
        barberId,
        locationId,
        windows: body?.windows ?? [],
        editor: { source: 'barber', policy: { selfService: true, allowOutsideHours: false } },
        changedBy: barberId,
      })
    );
    if (result.status === 'blocked') {
      throw new ConflictException({
        message: `${result.conflicts.length} visit(s) conflict with this schedule`,
        conflicts: result.conflicts,
      });
    }
    return { version: result.version };
  }

  @Get(':locationId/history')
  async history(@Param('locationId') locationId: string, @Req() req: Request) {
    const barberId = await this.barberOf(req);
    return this.changeLog
      .listByBarber(barberId)
      .then((changes) =>
        historyForBarber(changes, barberId).filter((change) => change.locationId === locationId)
      );
  }

  /** Вихідний/відпустка: застосовується одразу, наявні візити — конфлікти. */
  @Post(':locationId/unavailability')
  @HttpCode(HttpStatus.CREATED)
  async unavailability(
    @Param('locationId') locationId: string,
    @Body() body: { start: string; end: string; reason?: string },
    @Req() req: Request
  ) {
    const barberId = await this.barberOf(req);
    await this.assertAssigned(barberId, locationId);
    const policy = await this.policies.findForBarber(barberId);
    if (!policy?.selfService) {
      throw new ForbiddenException('Schedule editing is not delegated to the barber');
    }
    return this.mapErrors(() =>
      this.markUnavailable.execute({
        barberId,
        locationId,
        start: body.start,
        end: body.end,
        ...(body.reason ? { reason: body.reason } : {}),
        actorId: barberId,
      })
    );
  }

  private async barberOf(req: Request): Promise<string> {
    const session = clientSessionOf(req);
    if (!session) throw new ForbiddenException('Barber access required');
    const policy = await this.policies.findForBarber(session.userId);
    if (!policy) throw new ForbiddenException('Barber access required');
    return session.userId;
  }

  private async assertAssigned(barberId: string, locationId: string): Promise<void> {
    const assignment = await this.prisma.staffAssignment.findUnique({
      where: { barberId_locationId: { barberId, locationId } },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Barber is not assigned to this location');
  }

  private async mapErrors<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof ScheduleNotAllowedError) throw new ForbiddenException(error.message);
      if (error instanceof InvalidScheduleInputError || error instanceof ScheduleConflictError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof InvalidUnavailabilityError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
