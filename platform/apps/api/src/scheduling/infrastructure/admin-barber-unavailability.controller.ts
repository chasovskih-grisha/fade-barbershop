/* eslint-disable max-lines -- T-4616a: the three backend commands share one admin route group. */
/* eslint-disable max-params -- Nest injects each use case separately; the optional money step stays a 4th dependency instead of a wrapper provider. */
// T-4616a: backend-команди для майбутніх admin-поверхонь (самі екрани — T-4616b).
// PUT недоступності, окремий список конфліктів і рішення по кожному візиту.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
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
import {
  BarberCancelSettlement,
  type BarberCancelSettlementResult,
} from '../../payment/application/barber-cancel-settlement.use-case';

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

/** Рішення + його грошовий слід: візит скасовано, депозит повертається. */
type ResolvedWithMoney = ResolveShiftConflictResult & {
  settlements?: BarberCancelSettlementResult[];
};

@ApiTags('admin-barber-unavailability')
@Controller('admin')
export class AdminBarberUnavailabilityController {
  constructor(
    private readonly mark: MarkBarberUnavailable,
    private readonly list: ListShiftConflicts,
    private readonly resolve: ResolveShiftConflict,
    // Обов'язковий: PaymentModule реєструє провайдер, тож відсутність — помилка
    // збірки модуля, а не тихий пропуск повернення (T-4616b).
    @Inject(BarberCancelSettlement)
    private readonly cancellationMoney: BarberCancelSettlement
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
  ): Promise<ResolvedWithMoney> {
    const actor = adminActor(req);
    const result = await this.call(() => this.resolve.execute(toCommand(id, body, actor.actorId)));
    return this.withMoney(result);
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
    // Гроші — після кожного окремого рішення: партія скасовується разом, але
    // відмова повернення по одній нозі не відкочує інші.
    const outcomes: Awaited<ReturnType<ResolveShiftConflict['executeMany']>> = [];
    for (const command of commands) {
      const [outcome] = await this.resolve.executeMany([command]);
      if (!outcome) continue;
      // Гроші йдуть за скасованими візитами, а не за id конфлікту.
      if (outcome.status === 'resolved' && outcome.cancelledBookingIds?.length) {
        await this.settleCancelled(outcome.cancelledBookingIds);
      }
      outcomes.push(outcome);
    }
    return { outcomes };
  }

  /** Скасований візит звільняє крісло і повертає списаний депозит (T-094). */
  private async withMoney(result: ResolveShiftConflictResult): Promise<ResolvedWithMoney> {
    if (!result.changed || !result.cancelledBookingIds?.length) return result;
    return { ...result, settlements: await this.settleCancelled(result.cancelledBookingIds) };
  }

  private async settleCancelled(appointmentIds: string[]): Promise<BarberCancelSettlementResult[]> {
    const settlements: BarberCancelSettlementResult[] = [];
    for (const appointmentId of appointmentIds) {
      settlements.push(await this.cancellationMoney.settle({ appointmentId }));
    }
    return settlements;
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
