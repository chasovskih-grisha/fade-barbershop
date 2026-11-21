/* eslint-disable max-lines -- cohesive module (103 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4452: етапна реакція на no-show — HTTP-поверхня адмінки.
// Ендпоінти: POST /admin/no-show-staged/register — фіксувати no-show,
// POST /admin/no-show-staged/advance — перейти на наступний етап,
// POST /admin/no-show-staged/request-rebook — попросити повторний запис,
// POST /admin/no-show-staged/settle — закрити депозит,
// POST /admin/no-show-staged/settlement-due-at — коли депозит закриється автоматично,
// POST /admin/no-show-staged/due-for-automation — кейси, що чекають на автоматизацію,
// POST /admin/no-show-staged/:id/journal — журнал аудиту.

import { Body, Controller, Post, Param, Get } from '@nestjs/common';
import { NoShowStagedResponseService } from './application/no-show-staged-response.service';
import type {
  DepositDecision,
  NoShowStage,
  NoShowStagedRecord,
} from './domain/no-show-stage.policy';

@Controller('admin/no-show-staged')
export class NoShowStagedResponseController {
  constructor(private readonly service: NoShowStagedResponseService) {}

  /** Фіксація no-show: етап `detected`, кейс відкрито. */
  @Post('register')
  async register(
    @Body()
    body: {
      id: string;
      clientId: string;
      appointmentId: string;
      depositAmount?: number;
      actorId: string;
      at?: Date;
      note?: string;
    }
  ): Promise<NoShowStagedRecord> {
    return this.service.register({
      id: body.id,
      clientId: body.clientId,
      appointmentId: body.appointmentId,
      ...(body.depositAmount === undefined ? {} : { depositAmount: body.depositAmount }),
      actorId: body.actorId,
      ...(body.at === undefined ? {} : { at: body.at }),
      ...(body.note === undefined ? {} : { note: body.note }),
    });
  }

  /** Перейти на наступний етап (сповіщення → пропозиція → депозит). */
  @Post('advance')
  async advance(
    @Param('id') id: string,
    @Body() body: { stage: string; actorId: string; note?: string; at?: Date }
  ): Promise<NoShowStagedRecord> {
    return this.service.advance(id, body.stage as NoShowStage, {
      actorId: body.actorId,
      ...(body.note === undefined ? {} : { note: body.note }),
      ...(body.at === undefined ? {} : { at: body.at }),
    });
  }

  /** Попросити повторний запис: у лімітні дні — відмова, інакше пропозиція. */
  @Post('request-rebook')
  async requestRebook(
    @Param('id') id: string,
    @Body() body: { at?: Date; manualAllow?: boolean; actorId?: string }
  ): Promise<{
    allowed: boolean;
    reason: string;
    retryAfter?: Date;
    record: NoShowStagedRecord;
  }> {
    return this.service.requestRebook(id, {
      ...(body.at === undefined ? {} : { at: body.at }),
      ...(body.manualAllow === undefined ? {} : { manualAllow: body.manualAllow }),
      ...(body.actorId === undefined ? {} : { actorId: body.actorId }),
    });
  }

  /** Закрити депозит. */
  @Post('settle')
  async settle(
    @Param('id') id: string,
    @Body()
    body: {
      actorId: string;
      decision: string;
      amount?: number;
      note?: string;
      at?: Date;
    }
  ): Promise<NoShowStagedRecord> {
    return this.service.settle(id, {
      actorId: body.actorId,
      decision: body.decision as DepositDecision,
      ...(body.amount === undefined ? {} : { amount: body.amount }),
      ...(body.note === undefined ? {} : { note: body.note }),
      ...(body.at === undefined ? {} : { at: body.at }),
    });
  }

  /** Коли депозит закриється автоматично. */
  @Post('settlement-due-at')
  async settlementDueAt(@Param('id') id: string): Promise<Date> {
    return this.service.settlementDueAt(id);
  }

  /** Кейси, у яких вікно сповіщення/закриття вже настало. */
  @Post('due-for-automation')
  async dueForAutomation(@Body() body: { now?: Date }): Promise<NoShowStagedRecord[]> {
    const now = body.now ?? new Date();
    return this.service.dueForAutomation(now);
  }

  /** Повний журнал кейса для аудиту. */
  @Get(':id/journal')
  async journal(
    @Param('id') id: string
  ): Promise<{ at: string; action: string; reason: string; actor: string }[]> {
    return this.service.journal(id).then((entries) =>
      entries.map((e: any) => ({
        at: e.at.toISOString(),
        action: e.action,
        reason: e.note,
        actor: e.actor,
      }))
    );
  }
}
