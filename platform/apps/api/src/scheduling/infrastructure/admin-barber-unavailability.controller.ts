/* eslint-disable max-lines -- T-4616a: the three backend commands share one admin route group. */
// T-4616a: backend-команди для майбутніх admin-поверхонь (самі екрани — T-4616b).
// PUT недоступності, окремий список конфліктів і рішення по кожному візиту.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { InvalidUnavailabilityError } from '../domain/barber-unavailability';
import { InvalidSlotError } from '../domain/slot-validator';
import {
  MarkBarberUnavailable,
  type MarkBarberUnavailableResult,
} from '../application/mark-barber-unavailable.use-case';
import {
  ListShiftConflicts,
  type ShiftConflictView,
} from '../application/list-shift-conflicts.use-case';
import {
  ResolveShiftConflict,
  type ResolveManyOutcome,
  type ResolveShiftConflictCommand,
  type ResolveShiftConflictResult,
} from '../application/resolve-shift-conflict.use-case';
import { adminActor } from './admin-actor';

interface MarkBody {
  locationId?: string;
  start: string;
  end: string;
  reason?: string;
}

interface ResolveBody {
  decision: 'cancel' | 'reassign';
  barberId?: string;
  date?: string;
  start?: string;
  end?: string;
}

interface BatchResolveBody {
  decisions: Array<ResolveBody & { conflictId: string }>;
}

@ApiTags('admin-barber-unavailability')
@Controller('admin')
export class AdminBarberUnavailabilityController {
  constructor(
    private readonly mark: MarkBarberUnavailable,
    private readonly list: ListShiftConflicts,
    private readonly resolve: ResolveShiftConflict
  ) {}

  @Post('barbers/:barberId/unavailability')
  @HttpCode(HttpStatus.CREATED)
  async markUnavailable(
    @Param('barberId') barberId: string,
    @Body() body: MarkBody,
    @Req() req: Request
  ): Promise<MarkBarberUnavailableResult> {
    const actor = adminActor(req);
    return this.call(() =>
      this.mark.execute({
        barberId,
        ...(body.locationId ? { locationId: body.locationId } : {}),
        start: body.start,
        end: body.end,
        ...(body.reason ? { reason: body.reason } : {}),
        actorId: actor.actorId,
      })
    );
  }

  @Get('shift-conflicts')
  listOpen(
    @Query('barberId') barberId?: string,
    @Query('locationId') locationId?: string
  ): Promise<ShiftConflictView[]> {
    return this.list.execute({
      ...(barberId ? { barberId } : {}),
      ...(locationId ? { locationId } : {}),
    });
  }

  @Post('shift-conflicts/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveOne(
    @Param('id') id: string,
    @Body() body: ResolveBody,
    @Req() req: Request
  ): Promise<ResolveShiftConflictResult> {
    const actor = adminActor(req);
    return this.call(() => this.resolve.execute(toCommand(id, body, actor.actorId)));
  }

  @Post('shift-conflicts/resolve-batch')
  @HttpCode(HttpStatus.OK)
  async resolveBatch(
    @Body() body: BatchResolveBody,
    @Req() req: Request
  ): Promise<{ outcomes: ResolveManyOutcome[] }> {
    const actor = adminActor(req);
    const commands = (body.decisions ?? []).map((decision) =>
      toCommand(decision.conflictId, decision, actor.actorId)
    );
    return { outcomes: await this.resolve.executeMany(commands) };
  }

  private async call<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof InvalidUnavailabilityError || error instanceof InvalidSlotError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}

function toCommand(
  conflictId: string,
  body: ResolveBody,
  actorId: string
): ResolveShiftConflictCommand {
  if (body.decision === 'cancel') return { conflictId, actorId, decision: 'cancel' };
  if (!body.barberId || !body.date || !body.start || !body.end) {
    throw new HttpException(
      'Reassignment needs barberId, date, start and end',
      HttpStatus.BAD_REQUEST
    );
  }
  return {
    conflictId,
    actorId,
    decision: 'reassign',
    barberId: body.barberId,
    date: body.date,
    start: body.start,
    end: body.end,
  };
}
