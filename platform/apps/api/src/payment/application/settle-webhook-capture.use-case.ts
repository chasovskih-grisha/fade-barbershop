/* eslint-disable max-lines, complexity -- один оркестраційний потік: гілки — це правила крісла (скасований/прострочений/наше), рознесення по файлах сховало б порядок */
// T-091/T-4619: подія еквайрингу повідомляє, що гроші списані, але крісло
// вирішує візит, а не провайдер. Після capture вебхука ми лише закриваємо
// утримання: активне — підтверджує візит; прострочене/скасоване — ні, і гроші
// йдуть у той самий повернення-шлях, що й скасування (T-4619c).
//
// Другий capture тут неможливий: гроші вже списав провайдер, тому цей шлях
// ніколи не викликає `gateway.capture` — інакше пізній вебхук списав би двічі.
import type { Payment } from '../../billing/domain/payment.entity';
import type { Booking } from '../../scheduling/domain/booking';

export interface WebhookSettlementPayments {
  findById(id: string): Promise<Payment | null>;
}

export interface WebhookSettlementBookings {
  findById(id: string): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
}

export type WebhookHoldOutcome =
  | 'captured'
  | 'already_captured'
  | 'expired'
  | 'cancelled'
  | 'missing';

/** Порт утримання крісла — той самий, що в DepositFlow. */
export interface WebhookHoldPort {
  capture(appointmentId: string, now: Date): Promise<{ outcome: WebhookHoldOutcome }>;
}

export interface WebhookLateCaptureRefundPort {
  refundLateCapture(input: {
    bookingId: string;
    paymentId: string;
    amount: number;
  }): Promise<{ status: string; refundId?: string; adminNote?: string } | null>;
}

export type SettleWebhookCaptureOutcome =
  | 'confirmed'
  | 'already_confirmed'
  | 'expired'
  | 'ignored'
  | 'not_found';

export interface SettleWebhookCaptureResult {
  outcome: SettleWebhookCaptureOutcome;
  bookingId?: string;
  refund?: { status: string; refundId?: string; failureReason?: string };
}

export interface SettleWebhookCaptureDeps {
  payments: WebhookSettlementPayments;
  bookings: WebhookSettlementBookings;
  /** Без порту (старі тести) утримання не перевіряється — візит підтверджується. */
  holds?: WebhookHoldPort;
  /** Без порту пізній capture лишається в журналі для ручного повернення. */
  lateCaptureRefunds?: WebhookLateCaptureRefundPort;
  clock?: { now(): Date };
}

/** Статуси візиту, які підтвердження може підняти; решта — вже сталися. */
const CONFIRMABLE_BOOKING_STATUSES: ReadonlySet<string> = new Set(['pending', 'draft']);

export class SettleWebhookCapture {
  constructor(private readonly deps: SettleWebhookCaptureDeps) {}

  async execute(paymentId: string): Promise<SettleWebhookCaptureResult> {
    const payment = await this.deps.payments.findById(paymentId);
    if (!payment) return { outcome: 'not_found' };
    // Замовлення магазину не тримають крісла — here немає чого вирішувати.
    if (!payment.appointmentId) return { outcome: 'ignored' };

    const booking = await this.deps.bookings.findById(payment.appointmentId);
    if (!booking) return { outcome: 'ignored', bookingId: payment.appointmentId };

    if (booking.depositStatus === 'captured') {
      return { outcome: 'already_confirmed', bookingId: booking.id };
    }

    // Скасований візит не відроджується навіть активним утриманням: крісло
    // вже віддали, тож гроші лише повертаємо.
    if (booking.status === 'cancelled') {
      return this.settleLateCapture(booking, payment);
    }

    const now = this.deps.clock?.now() ?? new Date();
    const holdOutcome = await this.captureHold(booking.id, now);
    if (holdOutcome === 'captured' || holdOutcome === 'already_captured') {
      booking.depositStatus = 'captured';
      if (CONFIRMABLE_BOOKING_STATUSES.has(booking.status) || !booking.status) {
        booking.status = 'confirmed';
      }
      await this.deps.bookings.save(booking);
      return { outcome: 'confirmed', bookingId: booking.id };
    }

    return this.settleLateCapture(booking, payment);
  }

  /**
   * Гроші прийшли на крісло, яке вже не наше. Візит не підтверджуємо і не
   * відроджуємо; повернення ідемпотентне (той самий шлях, що й скасування).
   */
  private async settleLateCapture(
    booking: Booking,
    payment: Payment
  ): Promise<SettleWebhookCaptureResult> {
    if (booking.depositStatus !== 'expired') {
      booking.depositStatus = 'expired';
      await this.deps.bookings.save(booking);
    }
    const refund = await this.refundLateCapture(booking, payment);
    return {
      outcome: 'expired',
      bookingId: booking.id,
      ...(refund ? { refund } : {}),
    };
  }

  private async captureHold(appointmentId: string, now: Date): Promise<WebhookHoldOutcome> {
    if (!this.deps.holds) return 'captured';
    return (await this.deps.holds.capture(appointmentId, now)).outcome;
  }

  private async refundLateCapture(
    booking: Booking,
    payment: Payment
  ): Promise<SettleWebhookCaptureResult['refund']> {
    if (!this.deps.lateCaptureRefunds) return undefined;
    try {
      const refund = await this.deps.lateCaptureRefunds.refundLateCapture({
        bookingId: booking.id,
        paymentId: payment.id,
        amount: payment.amount,
      });
      if (!refund) return { status: 'failed', failureReason: 'refund_not_created' };
      return {
        status: refund.status,
        ...(refund.refundId ? { refundId: refund.refundId } : {}),
        ...(refund.adminNote ? { failureReason: refund.adminNote } : {}),
      };
    } catch (error) {
      // Збій повернення не робить вигляд, що гроші повернулись: платіж
      // лишається видимим для retry T-094.
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
