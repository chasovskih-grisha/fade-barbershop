/* eslint-disable max-params -- 1 signature whose 4-param contract is fixed by existing call sites (worst: zero, limit 3); API redesign tracked in T-2500f */
// Розрахунок депозита при завершенні візиту (T-160, PAY-WEB-07, PAY-005).
//
// Гроші вирішує снепшот умов візиту (PAY-ADM-09), а не поточна політика:
//   · своєчасне скасування (≥ вікна, дефолт 4 год) — депозит повертається;
//   · пізнє скасування і no-show — утримується (без фіскального реверсу);
//   · візит відбувся — депозит зараховується у рахунок, не повертається;
//   · перенесення — депозит переходить на новий слот.
// Повертаємо лише ту суму, яка справді списана (`captured`): скасований або
// невдалий платіж нічого не рухає (PAY-005).
import { freeCancelDeadline, type DepositTerms } from './deposit-terms';

export type AppointmentOutcome = 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export type DepositSettlementAction = 'release' | 'forfeit' | 'carry_over' | 'none';

export type DepositSettlementReason =
  | 'visit_completed'
  | 'timely_cancellation'
  | 'late_cancellation'
  | 'no_show'
  | 'rescheduled'
  | 'no_deposit'
  | 'not_captured';

export interface DepositSettlement {
  action: DepositSettlementAction;
  reason: DepositSettlementReason;
  /** Сума, що повертається клієнту, у копійках. */
  refundAmount: number;
  /** Сума, що лишається в салоні, у копійках. */
  retainedAmount: number;
  /** Дедлайн безкоштовного скасування зі снепшота; `null` — депозиту немає. */
  freeCancelDeadline: Date | null;
  /** Чи скасування було в межах вікна. */
  timely: boolean;
}

export function settleDeposit(input: {
  terms: DepositTerms | null;
  outcome: AppointmentOutcome;
  appointmentStart: Date;
  occurredAt: Date;
  /** Чи списані гроші насправді (Payment у статусі зібраного депозиту). */
  captured: boolean;
}): DepositSettlement {
  const { terms, outcome, appointmentStart, occurredAt } = input;
  const amount = terms?.amount ?? 0;

  if (!terms || amount <= 0) {
    return zero('none', 'no_deposit', null, false);
  }

  const deadline = freeCancelDeadline(appointmentStart, terms.cancellationWindowHours);

  if (outcome === 'rescheduled') {
    return { ...zero('carry_over', 'rescheduled', deadline, true), retainedAmount: 0 };
  }

  if (!input.captured) {
    return zero('none', 'not_captured', deadline, false);
  }

  if (outcome === 'completed') {
    // Депозит зараховується у рахунок візиту: гроші не повертаються, але й
    // не є штрафом — візит відбувся (PAY-WEB-07).
    return {
      action: 'release',
      reason: 'visit_completed',
      refundAmount: 0,
      retainedAmount: 0,
      freeCancelDeadline: deadline,
      timely: true,
    };
  }

  if (outcome === 'cancelled') {
    const timely = occurredAt.getTime() <= deadline.getTime();
    return timely
      ? {
          action: 'release',
          reason: 'timely_cancellation',
          refundAmount: amount,
          retainedAmount: 0,
          freeCancelDeadline: deadline,
          timely,
        }
      : {
          action: 'forfeit',
          reason: 'late_cancellation',
          refundAmount: 0,
          retainedAmount: amount,
          freeCancelDeadline: deadline,
          timely,
        };
  }

  // no_show: депозит не повертається, статус платежу не змінюється (NSH-003).
  return {
    action: 'forfeit',
    reason: 'no_show',
    refundAmount: 0,
    retainedAmount: amount,
    freeCancelDeadline: deadline,
    timely: false,
  };
}

function zero(
  action: DepositSettlementAction,
  reason: DepositSettlementReason,
  freeCancelDeadlineAt: Date | null,
  timely: boolean
): DepositSettlement {
  return {
    action,
    reason,
    refundAmount: 0,
    retainedAmount: 0,
    freeCancelDeadline: freeCancelDeadlineAt,
    timely,
  };
}
