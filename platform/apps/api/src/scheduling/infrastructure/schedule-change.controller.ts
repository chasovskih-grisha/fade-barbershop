/* eslint-disable max-lines -- cohesive module (106 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4458: HTTP-поверхня погодження зміни графіка.
// Клієнт: POST /schedule/change-requests, POST /schedule/change-requests/:id/confirm.
// Адмін:  GET/POST /admin/schedule/change-requests, …/:id/approve, …/:id/reject.
// Помилки домену → 400/404/409 (конфлікт стану або зайнятий слот).
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ScheduleChangeApprovalService,
  type ScheduleChangeView,
} from '../application/schedule-change-approval.service';
import {
  ScheduleChangeConflictError,
  ScheduleChangeError,
  type ScheduleChangeStatus,
  type SlotRef,
} from '../domain/schedule-change-request';

function mapError(error: unknown): never {
  if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
  if (error instanceof Error && error.message.includes('not found')) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof ScheduleChangeConflictError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof ScheduleChangeError) throw new BadRequestException(error.message);
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

@Controller('schedule/change-requests')
export class ClientScheduleChangeController {
  constructor(private readonly changes: ScheduleChangeApprovalService) {}

  /** Клієнт просить інший час (T-230); повтор з тим самим id — ідемпотентний. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(
    @Body()
    body: {
      id: string;
      appointmentId: string;
      clientId: string;
      currentSlot: SlotRef;
      requestedSlot?: SlotRef;
    }
  ): Promise<ScheduleChangeView> {
    try {
      return await this.changes.request(body);
    } catch (error) {
      mapError(error);
    }
  }

  /** Згода клієнта: рівно одна подія перенесення на `eventId`. */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Param('id') id: string, @Body() body: { clientId: string; eventId: string }) {
    try {
      return await this.changes.confirm(id, body);
    } catch (error) {
      mapError(error);
    }
  }
}

@Controller('admin/schedule/change-requests')
export class AdminScheduleChangeController {
  constructor(private readonly changes: ScheduleChangeApprovalService) {}

  @Get()
  async list(@Query('status') status?: ScheduleChangeStatus) {
    const items = await this.changes.list(status ? { status } : {});
    return { items, total: items.length };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      return await this.changes.get(id);
    } catch (error) {
      mapError(error);
    }
  }

  /** Оператор схвалює заявку й пропонує слот (клієнтський або свій). */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body() body: { by: string; slot?: SlotRef; windowMinutes?: number }
  ) {
    try {
      return await this.changes.approve(id, body);
    } catch (error) {
      mapError(error);
    }
  }

  /** Відхилення з причиною; альтернатива — за потреби (T-4453-черга). */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() body: { by: string; reason: string; alternativeSlot?: SlotRef }
  ) {
    try {
      return await this.changes.reject(id, body);
    } catch (error) {
      mapError(error);
    }
  }
}
