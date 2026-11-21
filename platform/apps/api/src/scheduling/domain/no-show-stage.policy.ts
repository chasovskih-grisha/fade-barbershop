/* eslint-disable max-lines, complexity, max-params -- cohesive module (225 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: settleDeposit, complexity 11 vs 10); refactor tracked in T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: assessRebook, limit 3); API redesign tracked in T-2500f */
/**
 * T-4452: пом'якшення no-show по етапах — чиста політика.
 *
 * Етапи: `detected → notified → rebook_offered → deposit_settled`.
 *  1. фіксація no-show і ручна дія адміна (дзвінок, повторний запис);
 *  2. автоматика: сповіщення клієнту й пропозиція нового слота;
 *  3. фінансова політика: депозит списується/повертається за конфігом,
 *     з повним журналом (хто, коли, скільки, чому).
 *
 * Вікна й ліміти — конфігом, без магічних чисел у сервісі. Правило
 * «no-show у лімітні дні повторного запису»: перші `rebookLimitDays` днів
 * після фіксації повторний запис заборонений, доки адмін явно не дозволить
 * (`allowManualRebookOnLimitDays`).
 */

export type NoShowStage = 'detected' | 'notified' | 'rebook_offered' | 'deposit_settled';

export const NO_SHOW_STAGE_ORDER: NoShowStage[] = [
  'detected',
  'notified',
  'rebook_offered',
  'deposit_settled',
];

export type NoShowJournalAction = NoShowStage | 'rebook_requested' | 'rebook_denied';

export interface NoShowJournalEntry {
  at: Date;
  action: NoShowJournalAction;
  actor: string;
  /** Сума, якої стосується запис (депозит), якщо є. */
  amount?: number;
  note: string;
}

export type DepositDecision = 'retained' | 'refunded' | 'none';

export interface NoShowStagedRecord {
  id: string;
  clientId: string;
  appointmentId: string;
  detectedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  stage: NoShowStage;
  depositAmount: number;
  depositDecision?: DepositDecision;
  journal: NoShowJournalEntry[];
}

export interface NoShowStagedConfig {
  /** Вікно, протягом якого пропонуємо повторний запис (днів). */
  rebookWindowDays: number;
  /** Скільки днів після no-show повторний запис заборонений. */
  rebookLimitDays: number;
  /** Через скільки годин після фіксації депозит закривається автоматично. */
  depositSettlementHours: number;
  /** Чи може адмін дозволити запис у лімітні дні. */
  allowManualRebookOnLimitDays: boolean;
}

export const NO_SHOW_STAGED_DEFAULTS: NoShowStagedConfig = {
  rebookWindowDays: 14,
  rebookLimitDays: 2,
  depositSettlementHours: 24,
  allowManualRebookOnLimitDays: false,
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function stageIndex(stage: NoShowStage): number {
  return NO_SHOW_STAGE_ORDER.indexOf(stage);
}

export function isStageReached(record: NoShowStagedRecord, stage: NoShowStage): boolean {
  return stageIndex(record.stage) >= stageIndex(stage);
}

/** Створює запис на етапі `detected` із першим записом журналу. */
export function openNoShow(input: {
  id: string;
  clientId: string;
  appointmentId: string;
  depositAmount: number;
  actorId: string;
  at?: Date;
  note?: string;
}): NoShowStagedRecord {
  if (input.depositAmount < 0) throw new Error('Deposit amount cannot be negative');
  const at = input.at ?? new Date();

  return {
    id: input.id,
    clientId: input.clientId,
    appointmentId: input.appointmentId,
    detectedAt: at,
    stage: 'detected',
    depositAmount: input.depositAmount,
    journal: [
      {
        at,
        action: 'detected',
        actor: input.actorId,
        note: input.note ?? 'No-show detected',
      },
    ],
  };
}

/** Чи можна перейти на етап зараз і чого бракує. */
export function canAdvance(
  record: NoShowStagedRecord,
  target: NoShowStage
): { allowed: boolean; reason: string } {
  if (target === record.stage) return { allowed: false, reason: 'Stage already reached' };
  if (stageIndex(target) < stageIndex(record.stage)) {
    return { allowed: false, reason: 'Cannot move the no-show backwards' };
  }
  if (stageIndex(target) > stageIndex(record.stage) + 1) {
    return { allowed: false, reason: `Stage ${target} requires ${record.stage} to finish first` };
  }
  if (target === 'deposit_settled' && record.depositAmount === 0) {
    return { allowed: true, reason: 'No deposit to settle; closing the case' };
  }
  return { allowed: true, reason: '' };
}

/** Переводить запис на наступний етап і пише це в журнал. */
export function advanceStage(
  record: NoShowStagedRecord,
  target: NoShowStage,
  input: { actorId: string; note?: string; at?: Date }
): NoShowStagedRecord {
  const gate = canAdvance(record, target);
  if (!gate.allowed) throw new Error(gate.reason);

  const at = input.at ?? new Date();
  return {
    ...record,
    stage: target,
    journal: [
      ...record.journal,
      { at, action: target, actor: input.actorId, note: input.note ?? `Stage ${target}` },
    ],
  };
}

export interface DepositSettlement {
  decision: DepositDecision;
  amount: number;
}

/** Закриває депозит: рішення фіксується в журналі разом із сумою. */
export function settleDeposit(
  record: NoShowStagedRecord,
  input: {
    actorId: string;
    decision: DepositDecision;
    amount?: number;
    note?: string;
    at?: Date;
  }
): NoShowStagedRecord {
  if (record.depositDecision) {
    return record; // ідемпотентно: рішення вже зафіксоване
  }
  if (record.stage !== 'rebook_offered') {
    throw new Error('Deposit can only be settled after the rebooking offer');
  }

  const amount = input.amount ?? record.depositAmount;
  if (amount < 0 || amount > record.depositAmount) {
    throw new Error(`Deposit amount must be between 0 and ${record.depositAmount}`);
  }
  if (input.decision === 'retained' && amount <= 0 && record.depositAmount > 0) {
    throw new Error('Retained deposit must have a positive amount');
  }

  const at = input.at ?? new Date();
  return {
    ...record,
    stage: 'deposit_settled',
    depositDecision: input.decision,
    journal: [
      ...record.journal,
      {
        at,
        action: 'deposit_settled',
        actor: input.actorId,
        amount,
        note: input.note ?? `Deposit ${input.decision}: ${amount}`,
      },
    ],
  };
}

/** Кінець лімітного вікна повторного запису. */
export function rebookBlockedUntil(
  record: NoShowStagedRecord,
  config: NoShowStagedConfig = NO_SHOW_STAGED_DEFAULTS
): Date {
  return new Date(record.detectedAt.getTime() + config.rebookLimitDays * DAY_MS);
}

/**
 * Чи може клієнт записатися знову.
 *
 * - у лімітні дні — ні, доки адмін не дозволив явно;
 * - після вікна пропозиції — ні, кейс закритий;
 * - поки депозит не закритий — запис дозволений, але з попередженням, що
 *   рішення ще відкрите (це не блокує клієнта).
 */
export function assessRebook(
  record: NoShowStagedRecord,
  config: NoShowStagedConfig = NO_SHOW_STAGED_DEFAULTS,
  requestedAt: Date = new Date(),
  options: { manualAllow?: boolean } = {}
): { allowed: boolean; reason: string; retryAfter?: Date } {
  const blockedUntil = rebookBlockedUntil(record, config);
  if (requestedAt.getTime() < blockedUntil.getTime()) {
    if (options.manualAllow && config.allowManualRebookOnLimitDays) {
      return { allowed: true, reason: 'Admin allowed rebooking inside the limit days' };
    }
    return {
      allowed: false,
      reason: `Rebooking is blocked for ${config.rebookLimitDays} day(s) after a no-show`,
      retryAfter: blockedUntil,
    };
  }

  const windowEndsAt = new Date(record.detectedAt.getTime() + config.rebookWindowDays * DAY_MS);
  if (requestedAt.getTime() > windowEndsAt.getTime()) {
    return {
      allowed: false,
      reason: `Rebooking offer expired after ${config.rebookWindowDays} day(s)`,
    };
  }

  if (record.stage === 'detected') {
    return { allowed: false, reason: 'Client has not been notified about the no-show yet' };
  }

  if (!record.depositDecision && record.depositAmount > 0) {
    return { allowed: true, reason: 'Deposit settlement is still open' };
  }

  return { allowed: true, reason: 'Rebooking allowed' };
}

/** Коли депозит закривається автоматично, якщо адмін не втрутився. */
export function depositSettlementDueAt(
  record: NoShowStagedRecord,
  config: NoShowStagedConfig = NO_SHOW_STAGED_DEFAULTS
): Date {
  return new Date(record.detectedAt.getTime() + config.depositSettlementHours * HOUR_MS);
}

/** Повний журнал кейса для адмін-звіту й аудиту. */
export function noShowSummary(record: NoShowStagedRecord): {
  id: string;
  clientId: string;
  appointmentId: string;
  stage: NoShowStage;
  depositAmount: number;
  depositDecision?: DepositDecision;
  entries: number;
  lastEntryAt?: Date;
  elapsedMinutes: number;
} {
  const last = record.journal[record.journal.length - 1];
  const summary: ReturnType<typeof noShowSummary> = {
    id: record.id,
    clientId: record.clientId,
    appointmentId: record.appointmentId,
    stage: record.stage,
    depositAmount: record.depositAmount,
    entries: record.journal.length,
    elapsedMinutes: Math.max(
      0,
      Math.round(((last?.at ?? record.detectedAt).getTime() - record.detectedAt.getTime()) / 60_000)
    ),
  };
  if (record.depositDecision) summary.depositDecision = record.depositDecision;
  if (last) summary.lastEntryAt = last.at;
  return summary;
}
