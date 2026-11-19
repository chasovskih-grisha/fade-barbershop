import type { Booking } from '../../scheduling/domain/booking';
import { depositTermsFor, type DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { depositPolicy as defaultDepositPolicy } from '../../scheduling/application/deposit-policy';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import { Payment } from '../../billing/domain/payment.entity';
import type { PaymentProps } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { CheckboxReceiptType } from './checkbox-fiscal-gateway';
import type { CheckboxReceipt } from './checkbox-fiscal-gateway';

export { CheckboxReceiptType, PaymentForm, PaymentStatus };
export type { CheckboxReceipt, DepositPolicy, PaymentProps };

/**
 * T-197: депозит при прийнятті слота з черги.
 *
 * 30% від фінальної ціни, округлення до 10 ₴, не більше самої ціни —
 * усе це вже описано політикою `depositTermsFor` (PAY-ADM-09), тому флоу
 * не рахує відсотки вдруге. Платіж іде через `Payment` з білінг-домену:
 * один enum статусів (AWAITING_DEPOSIT → DEPOSIT_PAID / CANCELLED), без
 * суміші зі scheduling-енумом.
 */

export interface WaitlistDepositInput {
  waitlistId: string;
  clientId: string;
  slotId: string;
  finalPrice: number;
  form?: PaymentForm;
  occurredAt?: Date;
}

export interface WaitlistDepositResult {
  payment: Payment;
  booking?: Booking;
  depositAmount: number;
  requiresBalance: boolean;
  depositReceipt?: CheckboxReceipt | null;
}

/** Запис платежу, привʼязаний до входу черги (звʼязок живе в репозиторії). */
export interface WaitlistPaymentRecord extends PaymentProps {
  waitlistId: string;
  slotId: string;
}

/** Порт збереження платежів депозиту черги. */
export interface WaitlistPaymentRepository {
  create(record: WaitlistPaymentRecord): Promise<Payment>;
  update(id: string, changes: Partial<WaitlistPaymentRecord>): Promise<Payment>;
  findById?(id: string): Promise<Payment | null>;
  findByWaitlistId?(waitlistId: string): Promise<Payment | null>;
}

/** Порт платіжного провайдера: списання депозиту. */
export interface DepositCaptureGateway {
  capture(paymentId: string, amount: number): Promise<boolean>;
}

/** Порт фіскального провайдера: підпис чека по депозиту. */
export interface DepositReceiptIssuer {
  issueReceipt(
    bookingId: string,
    amount: number,
    receiptType: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt>;
}

export interface WaitlistDepositDeps {
  paymentRepo: WaitlistPaymentRepository;
  depositPolicy?: () => Promise<DepositPolicy>;
  paymentGateway?: DepositCaptureGateway;
  checkboxGateway?: DepositReceiptIssuer;
  eventBus?: { publish: (event: { type: string; data: unknown }) => Promise<void> };
}

/** Статуси, у яких депозит уже зібраний (повторний виклик нічого не спише). */
const DEPOSIT_COLLECTED: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.DEPOSIT_PAID,
  PaymentStatus.AWAITING_BALANCE,
  PaymentStatus.PAID,
]);

export class WaitlistDepositFlow {
  constructor(private readonly deps: WaitlistDepositDeps) {}

  /** Платіж, привʼязаний до запису черги; `null`, якщо його ще немає. */
  async findPaymentByWaitlistId(waitlistId: string): Promise<Payment | null> {
    if (!this.deps.paymentRepo.findByWaitlistId) return null;
    return this.deps.paymentRepo.findByWaitlistId(waitlistId);
  }

  /** Фіскальний чек по депозиту; `null`, якщо gateway не підключений. */
  async issueDepositReceipt(
    waitlistId: string,
    amount: number,
    receiptId?: string
  ): Promise<CheckboxReceipt | null> {
    if (!this.deps.checkboxGateway) return null;
    return this.deps.checkboxGateway.issueReceipt(
      waitlistId,
      amount,
      CheckboxReceiptType.Deposit,
      receiptId
    );
  }

  async execute(input: WaitlistDepositInput): Promise<WaitlistDepositResult> {
    return withSpan({
      name: TRACING.WAITLIST_DEPOSIT_FLOW,
      options: {
        attributes: {
          'fade.waitlist.waitlist_id': input.waitlistId,
          'fade.waitlist.final_price': input.finalPrice,
        },
      },
      work: async () => this.collectDeposit(input),
    });
  }

  /** Сума депозиту за політикою мережі; 0 — депозит вимкнено або ціна 0. */
  depositAmountFor(finalPrice: number, policy: DepositPolicy): number {
    return depositTermsFor(finalPrice, policy)?.amount ?? 0;
  }

  private async collectDeposit(input: WaitlistDepositInput): Promise<WaitlistDepositResult> {
    const existing = await this.findPaymentByWaitlistId(input.waitlistId);
    if (existing && DEPOSIT_COLLECTED.has(existing.status)) {
      return {
        payment: existing,
        depositAmount: existing.amount,
        requiresBalance: existing.status !== PaymentStatus.PAID,
        depositReceipt: existing.receiptId
          ? await this.issueDepositReceipt(input.waitlistId, existing.amount, existing.receiptId)
          : null,
      };
    }

    const policy = (await this.deps.depositPolicy?.()) ?? defaultDepositPolicy;
    const depositAmount = this.depositAmountFor(input.finalPrice, policy);
    const now = input.occurredAt ?? new Date();

    const payment = await this.deps.paymentRepo.create({
      id: `pay_wl_${input.waitlistId}`,
      clientId: input.clientId,
      amount: depositAmount,
      form: input.form ?? PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: `wl_${input.waitlistId}_${now.getTime()}`,
      createdAt: now,
      updatedAt: now,
      waitlistId: input.waitlistId,
      slotId: input.slotId,
    });

    // Депозит вимкнено або візит безкоштовний (PAY-003): гроші не збираємо.
    if (depositAmount === 0) {
      const settled = await this.deps.paymentRepo.update(payment.id, {
        status: PaymentStatus.PAID,
        updatedAt: new Date(),
      });
      return {
        payment: settled,
        depositAmount: 0,
        requiresBalance: false,
        depositReceipt: null,
      };
    }

    let captured: boolean;
    try {
      captured = await this.capture(payment.id, depositAmount);
    } catch (error) {
      captured = false;
      console.error('Waitlist deposit payment gateway failed', {
        paymentId: payment.id,
        amount: depositAmount,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (!captured) {
      const cancelled = await this.deps.paymentRepo.update(payment.id, {
        status: PaymentStatus.CANCELLED,
        updatedAt: new Date(),
      });
      return {
        payment: cancelled,
        depositAmount: 0,
        requiresBalance: true,
        depositReceipt: null,
      };
    }

    // Чек підписуємо лише для справді списаного депозиту.
    const receipt = await this.issueDepositReceipt(input.waitlistId, depositAmount);
    const changes: Partial<WaitlistPaymentRecord> = {
      status: PaymentStatus.DEPOSIT_PAID,
      updatedAt: new Date(),
    };
    if (receipt?.check_id) changes.receiptId = receipt.check_id;

    const paid = await this.deps.paymentRepo.update(payment.id, changes);

    return {
      payment: paid,
      depositAmount,
      requiresBalance: true,
      depositReceipt: receipt,
    };
  }

  private async capture(paymentId: string, amount: number): Promise<boolean> {
    if (this.deps.paymentGateway) {
      return this.deps.paymentGateway.capture(paymentId, amount);
    }
    // Провайдер не підключений: симуляція для dev/локальних прогонів (як у T-091).
    return Math.random() > 0.1;
  }
}

/** Репозиторій у памʼяті для локального флоу без БД. */
export function createInMemoryWaitlistPaymentRepository(): WaitlistPaymentRepository {
  const records = new Map<string, WaitlistPaymentRecord>();

  return {
    async create(record) {
      records.set(record.id, { ...record });
      return new Payment(record);
    },
    async update(id, changes) {
      const current = records.get(id);
      if (!current) throw new Error(`Waitlist payment ${id} not found`);
      const next: WaitlistPaymentRecord = { ...current, ...changes };
      records.set(id, next);
      return new Payment(next);
    },
    async findById(id) {
      const record = records.get(id);
      return record ? new Payment(record) : null;
    },
    async findByWaitlistId(waitlistId) {
      for (const record of records.values()) {
        if (record.waitlistId === waitlistId) return new Payment(record);
      }
      return null;
    },
  };
}

// Єдиний екземпляр флоу створює SchedulingModule (див. scheduling.module.ts);
// модульний синглтон тут раніше створював другу, нічим не підключену копію.
