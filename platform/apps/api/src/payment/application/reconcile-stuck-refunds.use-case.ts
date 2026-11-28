// T-4616b: повернення, яке застрягло в `processing`, мусить дійти до кінця без
// людини. `T094Refund.initiateRefund` спершу зберігає refund у `processing` і
// лише потім іде в еквайринг/фіскальний чек; крах між цими кроками лишає візит
// зі статусом «гроші в дорозі», хоч їх ніхто не відправляв. Тік завершує той
// самий settlement: алокації в metadata роблять повтор безпечним (стабільний
// ключ `${refundId}:${paymentId}`), тож подвійного повернення не буде.
//
// Кожен refund — окремо: збій одного не зупиняє решту й не валить тік.

export interface StuckRefund {
  refundId: string;
  bookingId: string;
  initiatedAt: Date;
}

/** Читання повернень у `processing`, старших за поріг (ADR 0048 — без job engine). */
export interface StuckRefundRepository {
  listStuck(input: { olderThan: Date; limit: number }): Promise<StuckRefund[]>;
}

/** Мінімум із T094Refund, потрібний тіку. */
export interface ResumableRefunds {
  resumeProcessing(refundId: string): Promise<{ refundId: string; status: string }>;
}

export type RefundReconciliationOutcome =
  | { refundId: string; status: 'completed' | 'failed'; bookingId: string }
  | { refundId: string; status: 'error'; bookingId: string; detail: string };

export interface ReconcileStuckRefundsDeps {
  stuck: StuckRefundRepository;
  refunds: ResumableRefunds;
  clock: { now(): Date };
  /** Молодше за це — ще нормальний хід запиту, а не застрягання. */
  staleAfterMinutes?: number;
  limit?: number;
}

const DEFAULT_STALE_AFTER_MINUTES = 15;
const DEFAULT_LIMIT = 50;

export class ReconcileStuckRefunds {
  constructor(private readonly deps: ReconcileStuckRefundsDeps) {}

  async run(): Promise<RefundReconciliationOutcome[]> {
    const now = this.deps.clock.now();
    const staleAfterMs = (this.deps.staleAfterMinutes ?? DEFAULT_STALE_AFTER_MINUTES) * 60_000;
    const stuck = await this.deps.stuck.listStuck({
      olderThan: new Date(now.getTime() - staleAfterMs),
      limit: this.deps.limit ?? DEFAULT_LIMIT,
    });

    const outcomes: RefundReconciliationOutcome[] = [];
    for (const refund of stuck) {
      outcomes.push(await this.resume(refund));
    }
    return outcomes;
  }

  private async resume(refund: StuckRefund): Promise<RefundReconciliationOutcome> {
    try {
      const resumed = await this.deps.refunds.resumeProcessing(refund.refundId);
      return {
        refundId: refund.refundId,
        bookingId: refund.bookingId,
        status: resumed.status === 'completed' ? 'completed' : 'failed',
      };
    } catch (error) {
      // Refund міг завершитися між вибіркою й тіком: це не збій, але й не
      // «completed» без доказу — тік просто назве причину.
      return {
        refundId: refund.refundId,
        bookingId: refund.bookingId,
        status: 'error',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
