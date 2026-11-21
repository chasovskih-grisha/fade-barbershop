/* eslint-disable max-lines -- cohesive module (127 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-095: ескалація незакритих no-show (запланована задача): через 24 години
// візит зі статусом `pending` no-show фіксується остаточно.
//
// NSH-003: сама ескалація депозит **утримує** — платіж не рухається. Повернення
// відбувається лише коли ескалацію знімають (NSH-ADM-03 / PAY-005б), тому
// рішення передається явно (`resolution: 'refund'`), а не виводиться з суми.
// Гроші йдуть через `T094Refund`: захоплена сума, перший коміт виграє,
// видатковий чек і `failed` з обмеженими повторами — усе там.
import { Logger } from '@nestjs/common';
import { Booking } from '../domain/booking';
import { RefundEntity, RefundStatus } from '../../payment/domain/refund.entity';
import { T094Refund } from '../../payment/application/refund.use-case';
import { usePush } from '../../lib/notifications';

/** Читання й збереження бронювань, потрібні ескалації. */
export interface EscalationBookingReader {
  findMany(query: {
    where: { noShowStatus: string; start: { lt: Date } };
    order?: { start: 'asc' | 'desc' };
  }): Promise<Booking[]>;
  save(booking: Booking): Promise<void>;
}

export type EscalationResolution = 'retain' | 'refund';

export interface EscalationOptions {
  /** `retain` (дефолт) — депозит лишається, платіж не рухається (NSH-003). */
  resolution?: EscalationResolution;
  /** Код підстави для refund; дефолт — зняття no-show адміном (NSH-ADM-03). */
  reasonCode?: string;
  /** Ключ ідемпотентності refund; дефолт — `ns_<bookingId>`. */
  refundId?: string;
  now?: Date;
}

export interface EscalationResult {
  booking: Booking;
  refund: RefundEntity | null;
  refundError?: string;
  notificationSent: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class T095NoShowEscalation {
  constructor(
    private readonly bookingRepo: EscalationBookingReader,
    private readonly refundUseCase: T094Refund
  ) {}

  /** Візити, які прострочили no-show на 24 години й ще не ескаловані. */
  async findEligibleForEscalation(now: Date = new Date()): Promise<Booking[]> {
    const bookings = await this.bookingRepo.findMany({
      where: {
        noShowStatus: 'pending',
        start: { lt: new Date(now.getTime() - DAY_MS) },
      },
      order: { start: 'asc' },
    });

    return bookings.filter((booking) => {
      if (booking.noShowStatus === 'escalated') return false;
      if (booking.status === 'completed' || booking.status === 'cancelled') return false;
      return now.getTime() - booking.start.getTime() >= DAY_MS;
    });
  }

  /**
   * Ескалація одного візиту: фіксує статус і (за рішенням) повертає депозит.
   *
   * `refund` викликається до збереження остаточного статусу, щоб невдача
   * еквайрингу не залишила візит «ескалованим із поверненими грошима».
   */
  async escalateBooking(
    booking: Booking,
    options: EscalationOptions = {}
  ): Promise<EscalationResult> {
    const now = options.now ?? new Date();
    const resolution = options.resolution ?? 'retain';

    let refund: RefundEntity | null = null;
    let refundError: string | undefined;

    if (resolution === 'refund') {
      try {
        const result = await this.refundUseCase.initiateRefund(
          booking.id,
          undefined,
          options.reasonCode ?? 'NSH-ADM-03',
          options.refundId ?? `ns_${booking.id}`
        );
        refund = result.refund;
        booking.noShowRefundId = result.refund.refundId;
      } catch (error) {
        refundError = error instanceof Error ? error.message : String(error);
      }
    }

    // NSH-003: утримання депозиту не змінює статус платежу.
    booking.noShowStatus = refundError ? 'escalation_failed' : 'escalated';
    booking.noShowEscalatedAt = now;
    booking.status = 'cancelled';
    await this.bookingRepo.save(booking);

    const notificationSent = await this.notifyClient(booking, refund);

    const result: EscalationResult = { booking, refund, notificationSent };
    if (refundError) result.refundError = refundError;
    return result;
  }

  /** Пакетний прогін (cron): по одному візиту, помилки не зривають решту. */
  async runEscalation(options: EscalationOptions = {}): Promise<{
    totalChecked: number;
    totalEscalated: number;
    totalRefunded: number;
    errors: string[];
  }> {
    const now = options.now ?? new Date();
    const eligible = await this.findEligibleForEscalation(now);
    const errors: string[] = [];
    let totalEscalated = 0;
    let totalRefunded = 0;

    for (const booking of eligible) {
      try {
        const result = await this.escalateBooking(booking, { ...options, now });
        totalEscalated += 1;
        totalRefunded +=
          result.refund?.status === RefundStatus.COMPLETED ? result.refund.amount : 0;
        if (result.refundError) errors.push(`Booking ${booking.id}: ${result.refundError}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Logger.error(
          `No-show escalation error for booking ${booking.id}: ${message}`,
          'NoShowEscalation'
        );
        errors.push(`Booking ${booking.id}: ${message}`);
      }
    }

    return {
      totalChecked: eligible.length,
      totalEscalated,
      totalRefunded,
      errors,
    };
  }

  /** NSH-007: нейтральний текст, без штрафних формулювань. */
  private async notifyClient(booking: Booking, refund: RefundEntity | null): Promise<boolean> {
    const body = refund
      ? `Вас не було на записі ${booking.start.toLocaleDateString('uk-UA')}. Депозит повернено. Записатися знову можна в застосунку.`
      : `Вас не було на записі ${booking.start.toLocaleDateString('uk-UA')}. Записатися знову можна в застосунку.`;
    try {
      await usePush().send({
        title: 'Запис',
        body,
        data: { type: 'no_show_escalation', bookingId: booking.id },
      });
      return true;
    } catch (error) {
      Logger.error(`Failed to send no-show push: ${String(error)}`, 'NoShowEscalation');
      return false;
    }
  }
}
