/* eslint-disable max-lines, complexity -- cohesive module (223 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 25 vs 10); refactor tracked in T-2500f */
// T-197: депозит при прийнятті слота з черги — 30% від ціни візиту з
// округленням до десятків (PAY-ADM-09), списання через еквайринг, чек
// передоплати й закриваючий баланс на візиті. Повторний виклик не списує
// вдруге (PAY-WEB-03), а безоплатний візит не створює платіж (PAY-003).
import { Logger } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Booking } from '../../scheduling/domain/booking';
import type { BookingRepository } from '../../scheduling/domain/booking-repository';
import { depositTermsFor, type DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { depositPolicy as defaultDepositPolicy } from '../../scheduling/application/deposit-policy';
import { Payment, type PaymentProps } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';

export type { PaymentProps } from '../../billing/domain/payment.entity';
export { PaymentForm } from '../../billing/domain/payment-status.enum';
export { CheckboxReceiptType } from './checkbox-fiscal-gateway';

/** Дефолтна політика PAY-ADM-09 — той самий обʼєкт, що й у scheduling. */
export { DEFAULT_DEPOSIT_POLICY } from '../../scheduling/domain/deposit-terms';

export interface WaitlistDepositInput {
  waitlistId: string;
  clientId: string;
  /** Слот, який клієнт приймає; без нього депозит лише фіксує суму. */
  slotId?: string;
  /** Підсумкова ціна візиту; без неї депозит не рахується. */
  finalPrice?: number;
  occurredAt?: Date;
}

export interface WaitlistDepositResult {
  payment: Payment;
  booking?: Booking;
  depositAmount: number;
  requiresBalance: boolean;
  depositReceipt: CheckboxReceipt | null;
}

/** Платіж візиту черги: до білінгових полів додає зв'язок із записом черги. */
export interface WaitlistPaymentProps extends PaymentProps {
  waitlistId?: string;
  slotId?: string;
}

/** Сховище платежів черги очікування (у проді — Prisma billing). */
export interface WaitlistPaymentRepository {
  create(payment: WaitlistPaymentProps): Promise<Payment>;
  update(id: string, patch: Partial<WaitlistPaymentProps>): Promise<Payment>;
  findByWaitlistId(waitlistId: string): Promise<Payment | null>;
  findById(id: string): Promise<Payment | null>;
}

/** Провайдер еквайрингу для депозиту черги. */
export interface DepositCaptureGateway {
  capture(paymentId: string, amount: number): Promise<boolean>;
}

/** Фіскальний шлюз для чека депозиту. */
export interface DepositReceiptIssuer {
  issueReceipt(
    bookingId: string,
    amount: number,
    receiptType: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt>;
}

export interface WaitlistDepositDeps {
  /** Не використовується флоу напряму; лишається для сумісності композиції. */
  bookingRepo?: BookingRepository;
  paymentRepo: WaitlistPaymentRepository;
  depositPolicy?: () => Promise<DepositPolicy>;
  paymentGateway?: DepositCaptureGateway;
  checkboxGateway?: DepositReceiptIssuer;
  eventBus?: { publish(event: { type: string; data: Record<string, unknown> }): Promise<void> };
  fulfillWaitlistEntry?: (offerId: string, clientId: string) => Promise<Booking>;
}

/** Сховище платежів у памʼяті: ключ і за id, і за waitlistId. */
export function createInMemoryWaitlistPaymentRepository(): WaitlistPaymentRepository {
  const byId = new Map<string, Payment>();
  const byWaitlist = new Map<string, Payment>();
  const waitlistOfPayment = new Map<string, { waitlistId?: string; slotId?: string }>();

  const remember = (payment: Payment, links: { waitlistId?: string; slotId?: string }): Payment => {
    byId.set(payment.id, payment);
    waitlistOfPayment.set(payment.id, links);
    if (links.waitlistId) byWaitlist.set(links.waitlistId, payment);
    return payment;
  };

  return {
    async create(props: WaitlistPaymentProps): Promise<Payment> {
      const payment = new Payment(props);
      return remember(payment, {
        ...(props.waitlistId ? { waitlistId: props.waitlistId } : {}),
        ...(props.slotId ? { slotId: props.slotId } : {}),
      });
    },
    async update(id: string, patch: Partial<WaitlistPaymentProps>): Promise<Payment> {
      const existing = byId.get(id);
      if (!existing) throw new Error(`Payment ${id} not found`);
      const links = { ...(waitlistOfPayment.get(id) ?? {}) };
      if (patch.waitlistId) links.waitlistId = patch.waitlistId;
      if (patch.slotId) links.slotId = patch.slotId;
      const merged: PaymentProps = {
        ...existing.toJSON(),
        ...patch,
        updatedAt: patch.updatedAt ?? new Date(),
      };
      return remember(new Payment(merged), links);
    },
    async findByWaitlistId(waitlistId: string): Promise<Payment | null> {
      return byWaitlist.get(waitlistId) ?? null;
    },
    async findById(id: string): Promise<Payment | null> {
      return byId.get(id) ?? null;
    },
  };
}

export class WaitlistDepositFlow {
  private readonly fulfillWaitlistEntry: (offerId: string, clientId: string) => Promise<Booking>;

  constructor(public readonly deps: WaitlistDepositDeps) {
    this.fulfillWaitlistEntry =
      deps.fulfillWaitlistEntry ??
      (async () => {
        throw new Error('fulfillWaitlistEntry not implemented');
      });
  }

  async execute(input: WaitlistDepositInput): Promise<WaitlistDepositResult> {
    const existing = await this.deps.paymentRepo.findByWaitlistId(input.waitlistId);
    if (existing) {
      // Ідемпотентність: той самий слот не оплачується двічі.
      if (
        existing.status === PaymentStatus.DEPOSIT_PAID ||
        existing.status === PaymentStatus.PAID
      ) {
        return {
          payment: existing,
          depositAmount: existing.status === PaymentStatus.DEPOSIT_PAID ? existing.amount : 0,
          requiresBalance: existing.status === PaymentStatus.DEPOSIT_PAID,
          depositReceipt: null,
        };
      }
    }

    const policy = (await this.deps.depositPolicy?.()) ?? defaultDepositPolicy;
    const price = input.finalPrice ?? 0;

    // PAY-003: безоплатний візит або вимкнений депозит — платіж закрито як
    // оплачений, без списання і без чека.
    const terms = price > 0 ? depositTermsFor(price, policy) : null;
    if (!terms) {
      const payment = await this.deps.paymentRepo.create({
        id: existing?.id ?? uuidv7(),
        clientId: input.clientId,
        amount: 0,
        form: PaymentForm.CASH,
        status: PaymentStatus.PAID,
        traceId: `wl_${input.waitlistId}`,
        waitlistId: input.waitlistId,
        ...(input.slotId ? { slotId: input.slotId } : {}),
        createdAt: input.occurredAt ?? new Date(),
        updatedAt: new Date(),
      });
      return { payment, depositAmount: 0, requiresBalance: false, depositReceipt: null };
    }

    const depositAmount = terms.amount;
    const payment =
      existing ??
      (await this.deps.paymentRepo.create({
        id: uuidv7(),
        clientId: input.clientId,
        amount: depositAmount,
        form: PaymentForm.CARD,
        status: PaymentStatus.AWAITING_DEPOSIT,
        traceId: `wl_${input.waitlistId}`,
        waitlistId: input.waitlistId,
        ...(input.slotId ? { slotId: input.slotId } : {}),
        createdAt: input.occurredAt ?? new Date(),
        updatedAt: new Date(),
      }));

    let captured: boolean;
    try {
      captured = this.deps.paymentGateway
        ? await this.deps.paymentGateway.capture(payment.id, depositAmount)
        : false;
    } catch (error) {
      return this.decline(payment, error instanceof Error ? error.message : String(error));
    }
    if (!captured) return this.decline(payment, 'acquiring declined the deposit');

    const checkId = `deposit_${input.waitlistId}`;
    const receipt = this.deps.checkboxGateway
      ? await this.deps.checkboxGateway.issueReceipt(
          input.waitlistId,
          depositAmount,
          CheckboxReceiptType.Deposit,
          checkId
        )
      : null;

    const paid = await this.deps.paymentRepo.update(payment.id, {
      status: PaymentStatus.DEPOSIT_PAID,
      ...(receipt ? { receiptId: receipt.check_id } : { receiptId: checkId }),
      updatedAt: new Date(),
    });

    let booking: Booking | undefined;
    try {
      booking = await this.fulfillWaitlistEntry(input.waitlistId, input.clientId);
    } catch (error) {
      // Депозит лишається дійсним, навіть якщо створення візиту зірвалося.
      Logger.error(
        `Waitlist fulfillment failed, deposit still valid: ${payment.id} - ${error instanceof Error ? error.message : String(error)}`,
        'WaitlistDepositFlow'
      );
    }

    await this.deps.eventBus?.publish({
      type: 'scheduling.waitlist.deposit_captured',
      data: {
        waitlistId: input.waitlistId,
        paymentId: paid.id,
        amount: depositAmount,
        ...(receipt ? { receiptId: receipt.check_id } : {}),
      },
    });

    return {
      payment: paid,
      ...(booking ? { booking } : {}),
      depositAmount,
      requiresBalance: true,
      depositReceipt: receipt,
    };
  }

  private async decline(payment: Payment, reason: string): Promise<WaitlistDepositResult> {
    Logger.error(
      `Waitlist deposit payment failed: ${payment.id} - ${reason}`,
      'WaitlistDepositFlow'
    );
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
}

/** Порожній каркас для композиції в модулі; наповнюється при підключенні. */
export const waitlistDepositFlow = new WaitlistDepositFlow({
  paymentRepo: createInMemoryWaitlistPaymentRepository(),
  depositPolicy: async () => defaultDepositPolicy,
});
