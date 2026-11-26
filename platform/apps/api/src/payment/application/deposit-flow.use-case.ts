/* eslint-disable max-lines, complexity, max-statements -- cohesive module (219 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 17 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: an existing definition, 41 statements vs 30); extraction tracked in T-2500f */
// T-091: депозит при записі (30% FinalPrice, округлення 10 грн, снепшот
// політики PAY-ADM-09), ідемпотентність подвійного кліку (PAY-WEB-03) і
// чесне «гроші не списані» на помилці еквайрингу (PAY-WEB-05/06).
//
// Безоплатний візит (PAY-003/LYL-007) не створює `Payment` і не викликає
// фіскальний шлюз: guard стоїть за сумою, а не за причиною нуля.
import { uuidv7 } from '@fade/domain-shared';
import { Booking } from '../../scheduling/domain/booking';
import { Payment } from '../../billing/domain/payment.entity';
import {
  PaymentForm,
  PaymentStatus,
  isCapturedPaymentStatus,
} from '../../billing/domain/payment-status.enum';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';

/** Сховище платежів візиту; у проді — Prisma-адаптер billing. */
export interface AppointmentPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByAppointmentId(appointmentId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}

/** Вузький порт візиту: депозитному флоу потрібні читання й збереження. */
export interface BookingPaymentPort {
  findById(id: string): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
}

export interface DepositCaptureGateway {
  /** true — гроші списані; false — відмова; throw — помилка провайдера. */
  capture(paymentId: string, amount: number): Promise<boolean>;
}

export interface DepositReceiptGateway {
  issueReceipt(
    bookingId: string,
    amount: number,
    type: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt>;
  /** T-093: stored receipt state for the admin card (optional for legacy fakes). */
  findReceipt?(checkId: string): CheckboxReceipt | null;
}

export interface PaymentEventPublisher {
  publish(event: { type: string; data: Record<string, unknown> }): Promise<void>;
}

export type LateCaptureRefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LateCaptureRefundResult {
  status: LateCaptureRefundStatus;
  refundId: string;
  adminNote?: string;
}

/** T-4619c: повернення грошей, якщо утримання втрачено після списання. */
export interface LateCaptureRefundPort {
  refundLateCapture(input: {
    bookingId: string;
    paymentId: string;
    amount: number;
  }): Promise<LateCaptureRefundResult | null>;
}

export type DepositHoldState = 'active' | 'captured' | 'expired' | 'cancelled' | 'missing';

export interface DepositHoldPort {
  /** Стан без закриття утримання — перевірка перед списанням. */
  status(appointmentId: string, now: Date): Promise<DepositHoldState>;
  capture(
    appointmentId: string,
    now: Date
  ): Promise<{ outcome: Exclude<DepositHoldState, 'active'> | 'already_captured' }>;
  /** Невдалий платіж не має лишати крісло під утриманням. */
  release(appointmentId: string): Promise<boolean>;
  /** Server deadline for cabinet resume; absent in older test ports. */
  find?(appointmentId: string): Promise<{ expiresAt: Date; status: string } | null>;
}

export interface DepositFlowDeps {
  payments: AppointmentPaymentRepository;
  bookings: BookingPaymentPort;
  gateway: DepositCaptureGateway;
  receipts?: DepositReceiptGateway;
  events?: PaymentEventPublisher;
  /**
   * T-4619a: утримання крісла під депозит. Оплата підтверджує його, а після
   * прострочення — відмовляє, щоб не привʼязати гроші до вже вільного крісла.
   * Без порту — стара поведінка (без утримань).
   */
  holds?: DepositHoldPort;
  /** Автоматичне повернення пізнього capture; без порту гроші лишаються в журналі. */
  lateCaptureRefunds?: LateCaptureRefundPort;
  clock?: { now(): Date };
}

export type DepositOutcome =
  | 'captured'
  | 'already_paid'
  | 'complimentary'
  | 'no_deposit'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'unknown';

export interface DepositFlowResult {
  booking: Booking;
  outcome: DepositOutcome;
  payment?: Payment;
  depositAmount: number;
  requiresBalance: boolean;
  receipt?: CheckboxReceipt;
  failureReason?: string;
  /** T-4619c: результат повернення після втраченого утримання. */
  refund?: {
    status: LateCaptureRefundStatus;
    refundId?: string;
    failureReason?: string;
  };
  /** T-4619b: server chair-hold deadline, never a client-invented timer. */
  expiresAt?: string;
}

const CAPTURED_DEPOSIT = 'captured';

/** Сховище платежів у памʼяті — для тестів і локальних сценаріїв. */
export class InMemoryAppointmentPaymentRepository implements AppointmentPaymentRepository {
  private readonly payments = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment[]> {
    return [...this.payments.values()].filter((payment) => payment.appointmentId === appointmentId);
  }

  async save(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }
}

/** Сховище візитів у памʼяті: доменний агрегат мутується як у проді. */
export class InMemoryBookingPaymentRepository implements BookingPaymentPort {
  private readonly bookings = new Map<string, Booking>();

  constructor(seed: Booking[] = []) {
    seed.forEach((booking) => this.bookings.set(booking.id, booking));
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) ?? null;
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.set(booking.id, booking);
  }
}

export class DepositFlow {
  constructor(private readonly deps: DepositFlowDeps) {}

  async execute(bookingId: string): Promise<DepositFlowResult> {
    const booking = await this.deps.bookings.findById(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    const now = this.deps.clock?.now() ?? new Date();
    const price = booking.finalPrice ?? 0;

    // PAY-003: ComplimentaryVisit — без Payment, без чека, підтвердження одразу.
    if (!booking.requiresPayment || price <= 0) {
      if (booking.depositStatus !== 'exempt') {
        booking.depositStatus = 'exempt';
        booking.status = 'confirmed';
        await this.deps.bookings.save(booking);
      }
      return { booking, outcome: 'complimentary', depositAmount: 0, requiresBalance: false };
    }

    // PAY-WEB-03: повторний клік не створює другий платіж.
    const existing = await this.deps.payments.findByAppointmentId(booking.id);
    // Будь-який уже списаний депозит (зокрема зарахований у рахунок візиту або
    // частково повернений) — це не привід брати гроші вдруге.
    const paidDeposit = existing.find((payment) => isCapturedPaymentStatus(payment.status));
    if (paidDeposit) {
      return {
        booking,
        outcome: 'already_paid',
        payment: paidDeposit,
        depositAmount: paidDeposit.amount,
        requiresBalance: paidDeposit.amount < price,
      };
    }

    const depositAmount = this.resolveDepositAmount(booking);
    if (depositAmount <= 0) {
      booking.depositStatus = 'exempt';
      await this.deps.bookings.save(booking);
      return { booking, outcome: 'no_deposit', depositAmount: 0, requiresBalance: price > 0 };
    }

    // T-4619a: спершу перевіряємо утримання крісла, і лише потім беремо гроші.
    // Порядок навмисний: закрити утримання до списання означало б лишити
    // підтверджене крісло без оплати, якщо процес упаде між кроками. Відмова
    // еквайрингу звільняє активне утримання, тож клієнт може обрати новий слот.
    const hold = await this.holdStatus(booking, now);
    if (hold !== 'ok') {
      booking.depositStatus = 'expired';
      await this.deps.bookings.save(booking);
      return {
        booking,
        outcome: 'expired',
        depositAmount: 0,
        requiresBalance: price > 0,
        failureReason: `deposit_hold_${hold}`,
      };
    }

    const payment =
      existing.find(
        (candidate) =>
          candidate.status === PaymentStatus.AWAITING_DEPOSIT && candidate.amount === depositAmount
      ) ?? this.newPayment(booking, depositAmount, now);
    await this.deps.payments.save(payment);

    const checkId = `deposit_${booking.id}`;
    let captured: boolean;
    try {
      captured = await this.deps.gateway.capture(payment.id, depositAmount);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // With a chair hold, a provider timeout must not strand the hold: release
      // it and let the client retry. Without a hold there is nothing to release,
      // so keep the payment for reconciliation instead of claiming a decline.
      return this.deps.holds
        ? this.failDeposit(booking, payment, `acquiring error: ${reason}`)
        : this.unknownDeposit(booking, payment, `acquiring outcome unknown: ${reason}`);
    }
    if (!captured) {
      return this.failDeposit(booking, payment, 'acquiring declined the deposit');
    }

    const receipt = await this.issueReceipt(booking.id, depositAmount, checkId);
    payment.markDepositPaid(receipt?.check_id ?? checkId);
    await this.deps.payments.save(payment);

    const holdOutcome = await this.captureHold(booking, now);
    if (holdOutcome !== 'captured' && holdOutcome !== 'already_captured') {
      // Гонка: гроші списалися, коли утримання вже не наше. Візит не
      // підтверджуємо, щоб не привʼязати оплату до вільного крісла; одразу
      // ініціюємо повернення, а на збої платіж лишається для retry T-094.
      const refund = await this.refundLateCapture(booking, payment, depositAmount);
      // Refund and hold-expiry effects write the booking themselves; reload so
      // the expired deposit does not overwrite their status/refund fields.
      const latestBooking = (await this.deps.bookings.findById(booking.id)) ?? booking;
      latestBooking.depositStatus = 'expired';
      await this.deps.bookings.save(latestBooking);
      const latestPayment = (await this.deps.payments.findById(payment.id)) ?? payment;
      return {
        booking: latestBooking,
        outcome: 'expired',
        payment: latestPayment,
        depositAmount,
        requiresBalance: depositAmount < price,
        failureReason: `deposit_hold_${holdOutcome}_after_capture`,
        ...(refund ? { refund } : {}),
      };
    }

    booking.depositStatus = CAPTURED_DEPOSIT;
    booking.status = 'confirmed';
    await this.deps.bookings.save(booking);

    await this.deps.events?.publish({
      type: 'scheduling.appointment.payment_captured',
      data: {
        appointmentId: booking.id,
        paymentId: payment.id,
        amount: depositAmount,
        receiptId: receipt?.check_id ?? null,
      },
    });

    return {
      booking,
      outcome: 'captured',
      payment,
      depositAmount,
      requiresBalance: depositAmount < price,
      ...(receipt ? { receipt } : {}),
    };
  }

  /**
   * Read-only reconciliation for a lost POST response: reports what the stored
   * booking and payments prove. It never calls the acquiring gateway.
   */
  async status(bookingId: string): Promise<DepositFlowResult> {
    const booking = await this.deps.bookings.findById(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    const price = booking.finalPrice ?? 0;
    if (!booking.requiresPayment || price <= 0) {
      return { booking, outcome: 'complimentary', depositAmount: 0, requiresBalance: false };
    }

    const existing = await this.deps.payments.findByAppointmentId(booking.id);
    const paidDeposit = existing.find((payment) => isCapturedPaymentStatus(payment.status));
    if (paidDeposit) {
      return {
        booking,
        outcome: 'already_paid',
        payment: paidDeposit,
        depositAmount: paidDeposit.amount,
        requiresBalance: paidDeposit.amount < price,
      };
    }

    const depositAmount = this.resolveDepositAmount(booking);
    if (depositAmount <= 0) {
      return { booking, outcome: 'no_deposit', depositAmount: 0, requiresBalance: price > 0 };
    }

    const holdRecord = await this.deps.holds?.find?.(booking.id);
    const expiresAt = holdRecord ? { expiresAt: holdRecord.expiresAt.toISOString() } : {};
    const failed = existing.find((payment) => payment.status === PaymentStatus.CANCELLED);
    const now = this.deps.clock?.now() ?? new Date();
    const holdState = await this.holdStatus(booking, now);
    if (holdState !== 'ok') {
      return failed || booking.depositStatus === 'failed'
        ? {
            booking,
            outcome: 'failed',
            ...(failed ? { payment: failed } : {}),
            depositAmount: 0,
            requiresBalance: price > 0,
            failureReason: failed?.refundReason ?? 'deposit capture failed',
          }
        : {
            booking,
            outcome: 'expired',
            depositAmount: 0,
            requiresBalance: price > 0,
            failureReason: `deposit_hold_${holdState}`,
            ...expiresAt,
          };
    }

    const pending = existing.find(
      (payment) =>
        payment.status === PaymentStatus.AWAITING_DEPOSIT && payment.amount === depositAmount
    );
    if (pending) {
      return {
        booking,
        outcome: 'pending',
        payment: pending,
        depositAmount,
        requiresBalance: depositAmount < price,
        ...expiresAt,
      };
    }

    if (failed || booking.depositStatus === 'failed') {
      return {
        booking,
        outcome: 'failed',
        ...(failed ? { payment: failed } : {}),
        depositAmount: 0,
        requiresBalance: price > 0,
        failureReason: failed?.refundReason ?? 'deposit capture failed',
      };
    }

    if (booking.depositStatus === CAPTURED_DEPOSIT) {
      return {
        booking,
        outcome: 'already_paid',
        depositAmount,
        requiresBalance: depositAmount < price,
      };
    }

    return {
      booking,
      outcome: 'pending',
      depositAmount,
      requiresBalance: depositAmount < price,
      ...expiresAt,
    };
  }

  /**
   * PAY-ADM-09: джерело істини — снепшот візиту, а не поточна політика.
   * Зміна налаштувань діє лише на нові записи; `null` — депозит вимкнено
   * (або округлення дало 0, тобто конфіг поводиться як «вимкнено»).
   */
  private resolveDepositAmount(booking: Booking): number {
    return booking.deposit?.amount ?? 0;
  }

  /**
   * `ok` — крісло ще наше (утримання активне або вже підтверджене); інакше —
   * причина відмови. Відсутнє утримання — теж відмова: брати гроші за крісло,
   * яке ніхто не тримав, небезпечніше за помилку.
   */
  private async holdStatus(
    booking: Booking,
    now: Date
  ): Promise<'ok' | 'expired' | 'cancelled' | 'missing'> {
    if (!this.deps.holds) return 'ok';
    const status = await this.deps.holds.status(booking.id, now);
    return status === 'active' || status === 'captured' ? 'ok' : status;
  }

  private async captureHold(
    booking: Booking,
    now: Date
  ): Promise<'captured' | 'already_captured' | 'expired' | 'cancelled' | 'missing'> {
    if (!this.deps.holds) return 'captured';
    return (await this.deps.holds.capture(booking.id, now)).outcome;
  }

  /** Пізній capture не підтверджує візит; гроші повертаємо, не змінюючи результат. */
  private async refundLateCapture(
    booking: Booking,
    payment: Payment,
    amount: number
  ): Promise<DepositFlowResult['refund']> {
    if (!this.deps.lateCaptureRefunds) return undefined;
    try {
      const refund = await this.deps.lateCaptureRefunds.refundLateCapture({
        bookingId: booking.id,
        paymentId: payment.id,
        amount,
      });
      if (!refund) return { status: 'failed', failureReason: 'refund_not_created' };
      return {
        status: refund.status,
        refundId: refund.refundId,
        ...(refund.adminNote ? { failureReason: refund.adminNote } : {}),
      };
    } catch (error) {
      // Refund failure is surfaced instead of pretending money moved; the
      // payment stays visible for T-094 retry.
      return {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private newPayment(booking: Booking, amount: number, now: Date): Payment {
    return new Payment({
      id: uuidv7(),
      appointmentId: booking.id,
      ...(booking.clientId ? { clientId: booking.clientId } : { clientId: '' }),
      amount,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: `deposit_${booking.id}_${now.getTime()}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  private async issueReceipt(
    bookingId: string,
    amount: number,
    checkId: string
  ): Promise<CheckboxReceipt | undefined> {
    if (!this.deps.receipts) return undefined;
    try {
      return await this.deps.receipts.issueReceipt(
        bookingId,
        amount,
        CheckboxReceiptType.Deposit,
        checkId
      );
    } catch {
      // Гроші вже списані: збій фіскального провайдера не робить платіж
      // неоплаченим. Чек можна перевипустити за детермінованим checkId.
      return undefined;
    }
  }

  private unknownDeposit(booking: Booking, payment: Payment, reason: string): DepositFlowResult {
    return {
      booking,
      outcome: 'unknown',
      payment,
      depositAmount: payment.amount,
      requiresBalance: (booking.finalPrice ?? 0) > 0,
      failureReason: reason,
    };
  }

  private async failDeposit(
    booking: Booking,
    payment: Payment,
    reason: string
  ): Promise<DepositFlowResult> {
    // T-4619a: відмова/помилка еквайрингу звільняє крісло негайно, інакше
    // невдала оплата тримає його до закінчення 15-хвилинного вікна.
    await this.deps.holds?.release(booking.id);
    payment.failCapture(reason);
    await this.deps.payments.save(payment);
    booking.depositStatus = 'failed';
    await this.deps.bookings.save(booking);
    return {
      booking,
      outcome: 'failed',
      payment,
      depositAmount: 0,
      requiresBalance: (booking.finalPrice ?? 0) > 0,
      failureReason: reason,
    };
  }
}
