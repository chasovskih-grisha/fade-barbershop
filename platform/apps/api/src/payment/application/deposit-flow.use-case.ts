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
}

export interface PaymentEventPublisher {
  publish(event: { type: string; data: Record<string, unknown> }): Promise<void>;
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
  holds?: {
    /** T-4619a: стан утримання без його закриття — перевірка перед списанням. */
    status?(
      appointmentId: string,
      now: Date
    ): Promise<'active' | 'captured' | 'expired' | 'cancelled' | 'missing'>;
    capture(
      appointmentId: string,
      now: Date
    ): Promise<{ outcome: 'captured' | 'already_captured' | 'expired' | 'cancelled' | 'missing' }>;
  };
  clock?: { now(): Date };
}

export type DepositOutcome =
  'captured' | 'already_paid' | 'complimentary' | 'no_deposit' | 'failed' | 'expired';

export interface DepositFlowResult {
  booking: Booking;
  outcome: DepositOutcome;
  payment?: Payment;
  depositAmount: number;
  requiresBalance: boolean;
  receipt?: CheckboxReceipt;
  failureReason?: string;
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
    // Саме утримання закриваємо після успішного списання: відмова еквайрингу
    // лишає візит у тому ж активному вікні й клієнт може повторити оплату.
    const hold = await this.holdStatus(booking, now);
    if (hold === 'expired' || hold === 'cancelled') {
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
      return this.failDeposit(
        booking,
        payment,
        `acquiring error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (!captured) {
      return this.failDeposit(booking, payment, 'acquiring declined the deposit');
    }

    const receipt = await this.issueReceipt(booking.id, depositAmount, checkId);
    payment.markDepositPaid(receipt?.check_id ?? checkId);
    await this.deps.payments.save(payment);

    const confirmedHold = await this.captureHold(booking, now);
    if (!confirmedHold) {
      // Гонка: гроші списалися, коли вікно вже минуло. Візит не підтверджуємо,
      // щоб не привʼязати оплату до крісла, яке вже могло дістатися іншому.
      booking.depositStatus = 'expired';
      await this.deps.bookings.save(booking);
      return {
        booking,
        outcome: 'expired',
        payment,
        depositAmount,
        requiresBalance: depositAmount < price,
        failureReason: 'deposit_hold_expired_after_capture',
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
   * PAY-ADM-09: джерело істини — снепшот візиту, а не поточна політика.
   * Зміна налаштувань діє лише на нові записи; `null` — депозит вимкнено
   * (або округлення дало 0, тобто конфіг поводиться як «вимкнено»).
   */
  private resolveDepositAmount(booking: Booking): number {
    return booking.deposit?.amount ?? 0;
  }

  /**
   * `ok` — крісло ще наше (утримання активне або вже підтверджене); інакше —
   * причина відмови, щоб клієнт бачив, чи вікно минуло, чи візит скасовано.
   */
  private async holdStatus(booking: Booking, now: Date): Promise<'ok' | 'expired' | 'cancelled'> {
    if (!this.deps.holds) return 'ok';
    if (!this.deps.holds.status) return 'ok';
    const status = await this.deps.holds.status(booking.id, now);
    if (status === 'expired') return 'expired';
    if (status === 'cancelled') return 'cancelled';
    return 'ok';
  }

  private async captureHold(booking: Booking, now: Date): Promise<boolean> {
    if (!this.deps.holds) return true;
    const { outcome } = await this.deps.holds.capture(booking.id, now);
    return outcome !== 'expired' && outcome !== 'cancelled';
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

  private async failDeposit(
    booking: Booking,
    payment: Payment,
    reason: string
  ): Promise<DepositFlowResult> {
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
