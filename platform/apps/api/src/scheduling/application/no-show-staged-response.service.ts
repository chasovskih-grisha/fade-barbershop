// T-4452: етапна реакція на no-show. Правила — у no-show-stage.policy,
// тут порт сховища й послідовність кроків + журнал для аудиту.
//
// Сховище in-memory: у `prisma/schema.prisma` немає таблиці no-show кейсів,
// тож durable-версія з'явиться разом із persistence-слайсом (T-160).
// Порт `NoShowStagedRepository` готовий прийняти Prisma-адаптер.
import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  NO_SHOW_STAGED_DEFAULTS,
  advanceStage,
  assessRebook,
  depositSettlementDueAt,
  noShowSummary,
  openNoShow,
  settleDeposit,
  type DepositDecision,
  type NoShowJournalEntry,
  type NoShowStage,
  type NoShowStagedConfig,
  type NoShowStagedRecord,
} from '../domain/no-show-stage.policy';

export const NO_SHOW_STAGED_REPOSITORY = 'NO_SHOW_STAGED_REPOSITORY';

export interface NoShowStagedRepository {
  findById(id: string): Promise<NoShowStagedRecord | null>;
  save(record: NoShowStagedRecord): Promise<void>;
  list(): Promise<NoShowStagedRecord[]>;
}

export class InMemoryNoShowStagedRepository implements NoShowStagedRepository {
  private readonly records = new Map<string, NoShowStagedRecord>();

  async findById(id: string): Promise<NoShowStagedRecord | null> {
    return this.records.get(id) ?? null;
  }

  async save(record: NoShowStagedRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async list(): Promise<NoShowStagedRecord[]> {
    return [...this.records.values()];
  }
}

@Injectable()
export class NoShowStagedResponseService {
  private readonly config: NoShowStagedConfig;

  constructor(
    @Inject(NO_SHOW_STAGED_REPOSITORY)
    private readonly repository: NoShowStagedRepository,
    @Optional() config?: NoShowStagedConfig
  ) {
    this.config = config ?? NO_SHOW_STAGED_DEFAULTS;
  }

  /** Фіксація no-show: етап `detected`, кейс відкрито (авто або адмін). */
  async register(input: {
    id: string;
    clientId: string;
    appointmentId: string;
    depositAmount?: number;
    actorId: string;
    at?: Date;
    note?: string;
  }): Promise<NoShowStagedRecord> {
    const existing = await this.repository.findById(input.id);
    if (existing) return existing; // ідемпотентно: повторна фіксація не дублює кейс

    const record = openNoShow({ ...input, depositAmount: input.depositAmount ?? 0 });
    await this.repository.save(record);
    return record;
  }

  /** Наступний етап: сповіщення → пропозиція запису → закриття депозиту. */
  async advance(
    id: string,
    stage: NoShowStage,
    input: { actorId: string; note?: string; at?: Date }
  ): Promise<NoShowStagedRecord> {
    const record = await this.require(id);
    const updated = advanceStage(record, stage, input);
    await this.repository.save(updated);
    return updated;
  }

  /**
   * Спроба повторного запису: у лімітні дні відмова фіксується в журналі
   * (`rebook_denied`), дозвіл пропонує наступний етап.
   */
  async requestRebook(
    id: string,
    input: { at?: Date; manualAllow?: boolean; actorId?: string } = {}
  ): Promise<{
    allowed: boolean;
    reason: string;
    retryAfter?: Date;
    record: NoShowStagedRecord;
  }> {
    const record = await this.require(id);
    const at = input.at ?? new Date();
    const assessment = assessRebook(record, this.config, at, {
      manualAllow: input.manualAllow ?? false,
    });

    const entry: NoShowJournalEntry = {
      at,
      action: assessment.allowed ? 'rebook_requested' : 'rebook_denied',
      actor: input.actorId ?? record.clientId,
      note: assessment.reason,
    };
    const updated: NoShowStagedRecord = {
      ...record,
      journal: [...record.journal, entry],
    };
    await this.repository.save(updated);

    return { ...assessment, record: updated };
  }

  /** Фінансова політика: депозит утримано/повернуто, журнал фіксує рішення. */
  async settle(
    id: string,
    input: {
      actorId: string;
      decision: DepositDecision;
      amount?: number;
      note?: string;
      at?: Date;
    }
  ): Promise<NoShowStagedRecord> {
    const record = await this.require(id);
    const updated = settleDeposit(record, input);
    await this.repository.save(updated);
    return updated;
  }

  /** Коли депозит закриється автоматично. */
  async settlementDueAt(id: string): Promise<Date> {
    return depositSettlementDueAt(await this.require(id), this.config);
  }

  /** Кейси, у яких вікно сповіщення/закриття вже настало. */
  async dueForAutomation(now: Date = new Date()): Promise<NoShowStagedRecord[]> {
    const records = await this.repository.list();
    return records.filter((record) => {
      if (record.stage === 'detected') {
        return now.getTime() >= record.detectedAt.getTime();
      }
      if (record.stage === 'rebook_offered' && !record.depositDecision) {
        return now.getTime() >= depositSettlementDueAt(record, this.config).getTime();
      }
      return false;
    });
  }

  async summary(id: string): Promise<ReturnType<typeof noShowSummary>> {
    return noShowSummary(await this.require(id));
  }

  /** Повний журнал кейса для аудиту (клієнт, сума, етап, хто виконав). */
  async journal(id: string): Promise<NoShowJournalEntry[]> {
    return (await this.require(id)).journal;
  }

  private async require(id: string): Promise<NoShowStagedRecord> {
    const record = await this.repository.findById(id);
    if (!record) throw new Error(`No-show case ${id} not found`);
    return record;
  }
}
