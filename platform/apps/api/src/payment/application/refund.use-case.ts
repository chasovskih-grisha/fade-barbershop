/* eslint-disable max-lines, complexity, max-params -- cohesive module (217 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 functions with inherent domain branching (worst: an existing definition, complexity 14 vs 10); refactor tracked in T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// T-094: повернення коштів (PAY-005…010).
//
// - тригери: скасування клієнтом у межах вікна (PAY-004) — автоматично;
//   зняття no-show адміном (PAY-005b) — командою;
// - сума ніколи не перевищує фактично сплачене (PAY-010), часткове повернення
//   допускається;
// - перший коміт виграє: повторний виклик повертає наявний refund, а не
//   створює другий (PAY-008);
// - невдача еквайрингу → `failed` і `retryRefund` (PAY-009);
// - видатковий чек на суму повернення з посиланням на оригінал (PAY-010).
import { uuidv7 } from '@fade/domain-shared';
import type { Booking } from '../../scheduling/domain/booking';
import { DEFAULT_DEPOSIT_POLICY } from '../../scheduling/domain/deposit-terms';
import type { AcquiringGateway } from '../../billing/domain/acquiring.gateway.interface';
import { isCapturedPaymentStatus } from '../../billing/domain/payment-status.enum';
import { RefundReason, RefundStatus, type RefundEntity } from '../domain/refund.entity';
import type { AppointmentPaymentRepository } from './deposit-flow.use-case';

/** Порт візиту для refund-флоу: читати, знайти за refund id, зберегти. */
export interface RefundBookingPort {
  findById(id: string): Promise<Booking | null>;
  findByRefundId?(refundId: string): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
}

/** Видатковий чек (Checkbox `return`) на суму повернення. */
export interface ExpenditureReceiptGateway {
  issueRefundReceipt(input: {
    refundId: string;
    bookingId: string;
    amount: number;
    relatedReceiptId?: string;
  }): Promise<{ receiptId: string; status: 'done' | 'failed'; error?: string }>;
}

export const MAX_REFUND_RETRIES = 2;

type RefundAcquiringGateway = Pick<AcquiringGateway, 'refundPayment'>;

interface RefundAllocation {
  paymentId: string;
  amount: number;
  refundId: string;
}

interface RefundMetadataRecord {
  completedAt?: string;
  receiptId?: string;
  retryCount?: number;
  note?: string;
  allocations?: RefundAllocation[];
}

const REASON_BY_CODE: Record<string, RefundReason> = {
  'PAY-004': RefundReason.CANCELLATION,
  // NSH-ADM-03 — адмін знімає no-show і повертає депозит (PAY-005б).
  'NSH-ADM-03': RefundReason.NO_SHOW,
  'NSH-ADM-04': RefundReason.NO_SHOW,
  ADMIN_WITHDRAWAL: RefundReason.ADMIN_WITHDRAWAL,
  FRAUD_PREVENTION: RefundReason.FRAUD_PREVENTION,
  DUPLICATE_BOOKING: RefundReason.DUPLICATE_BOOKING,
  SYSTEM_ERROR: RefundReason.SYSTEM_ERROR,
};

function refundMethodOf(value: string | null): RefundEntity['paymentMethod'] {
  return value === 'cash' || value === 'card' || value === 'deposit' || value === 'walk-in'
    ? value
    : 'walk-in';
}

function readMetadata(raw: string | null): RefundMetadataRecord {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const metadata: RefundMetadataRecord = {};
    if (typeof record.completedAt === 'string') metadata.completedAt = record.completedAt;
    if (typeof record.receiptId === 'string') metadata.receiptId = record.receiptId;
    if (typeof record.retryCount === 'number') metadata.retryCount = record.retryCount;
    if (typeof record.note === 'string') metadata.note = record.note;
    if (Array.isArray(record.allocations)) {
      metadata.allocations = record.allocations.flatMap((entry) => {
        if (typeof entry !== 'object' || entry === null) return [];
        const allocation = entry as Record<string, unknown>;
        if (
          typeof allocation.paymentId !== 'string' ||
          typeof allocation.refundId !== 'string' ||
          typeof allocation.amount !== 'number'
        ) {
          return [];
        }
        return [
          {
            paymentId: allocation.paymentId,
            refundId: allocation.refundId,
            amount: allocation.amount,
          },
        ];
      });
    }
    return metadata;
  } catch {
    return {};
  }
}

/**
 * Скасування в межах вікна (PAY-004): до дедлайну візит можна скасувати з
 * поверненням депозиту. Снепшот `cancellationWindowHours` має пріоритет.
 */
export function canRefundCancellation(booking: Booking, now: Date = new Date()): boolean {
  const windowHours =
    booking.deposit?.cancellationWindowHours ?? DEFAULT_DEPOSIT_POLICY.cancellationWindowHours;
  const deadline = new Date(booking.start.getTime() - windowHours * 3_600_000);
  return now.getTime() <= deadline.getTime();
}

export class T094Refund {
  constructor(
    private readonly bookingRepo: RefundBookingPort,
    private readonly gateway: ExpenditureReceiptGateway,
    private readonly now: () => Date = () => new Date(),
    private readonly payments?: AppointmentPaymentRepository,
    private readonly acquiring?: RefundAcquiringGateway
  ) {}

  /**
   * Ініціювати повернення. `refundId` — наш ключ ідемпотентності; повторний
   * виклик з тим самим (або без) ключем повертає наявний refund.
   */
  async initiateRefund(
    bookingId: string,
    amount?: number,
    reasonCode?: string,
    refundId?: string
  ): Promise<{ refund: RefundEntity; isDuplicate: boolean }> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    // PAY-008: гонка скасування/no-show — перший коміт виграє.
    if (booking.refundId) {
      return { refund: this.toEntity(booking), isDuplicate: true };
    }

    // Невідомий код не можна тихо перетворювати на SYSTEM_ERROR: це обходило б
    // вікно безкоштовного скасування для PAY-004.
    const mappedReason = reasonCode ? REASON_BY_CODE[reasonCode] : undefined;
    if (reasonCode && !mappedReason) {
      throw new Error(`Unknown refund reason code ${reasonCode}`);
    }
    const reason = mappedReason ?? RefundReason.CANCELLATION;
    const at = this.now();

    if (reason === RefundReason.CANCELLATION && !canRefundCancellation(booking, at)) {
      throw new Error(
        'Cancellation is outside the free cancellation window: the deposit is retained'
      );
    }

    const capturedTotal = await this.availableRefundTotal(booking);
    if (capturedTotal <= 0) throw new Error('No captured payment to refund');
    const requested = amount ?? capturedTotal;
    if (!Number.isFinite(requested) || requested <= 0) {
      throw new Error(`Invalid refund amount ${amount ?? 0}`);
    }
    const validatedAmount = Math.round(requested);
    if (validatedAmount > capturedTotal) {
      throw new Error(
        `Refund amount ${validatedAmount} exceeds available captured amount ${capturedTotal}`
      );
    }

    const id = refundId ?? uuidv7();
    const metadata: RefundMetadataRecord = { retryCount: 0, allocations: [] };
    if (reasonCode) metadata.note = reasonCode;
    this.applyToBooking(booking, {
      refundId: id,
      status: RefundStatus.PROCESSING,
      amount: validatedAmount,
      reason,
      ...(reasonCode ? { reasonCode } : {}),
      at,
      metadata,
    });
    await this.bookingRepo.save(booking);

    return { refund: await this.settle(booking, at), isDuplicate: false };
  }

  /** PAY-009: повторна команда еквайрингу після `failed`. */
  async retryRefund(refundId: string): Promise<RefundEntity> {
    const booking = await this.findByRefundId(refundId);
    if (!booking) throw new Error(`Refund ${refundId} not found`);
    if (booking.refundStatus !== RefundStatus.FAILED) {
      throw new Error(`Refund ${refundId} is not in failed status`);
    }
    const metadata = readMetadata(booking.refundMetadata);
    const retryCount = metadata.retryCount ?? 0;
    if (retryCount >= MAX_REFUND_RETRIES) {
      throw new Error(`Maximum refund retry attempts (${MAX_REFUND_RETRIES}) reached`);
    }

    const at = this.now();
    booking.refundStatus = RefundStatus.PROCESSING;
    booking.refundMetadata = JSON.stringify({
      ...metadata,
      retryCount: retryCount + 1,
      allocations: metadata.allocations ?? [],
    });
    await this.bookingRepo.save(booking);
    return this.settle(booking, at);
  }

  /** Стан повернення для адмінки й кабінету (PAY-WEB-08). */
  async refundStatus(refundId: string): Promise<RefundEntity | null> {
    const booking = await this.findByRefundId(refundId);
    return booking ? this.toEntity(booking) : null;
  }

  /** Сума повернення не перевищує фактично сплачене (PAY-010). */
  validateRefundAmount(capturedTotal: number, requested: number): number {
    if (!Number.isFinite(requested) || requested <= 0) return 0;
    return Math.min(Math.round(requested), capturedTotal);
  }

  /** Сплачене: депозит (якщо captured) + решта завершеного візиту. */
  capturedAmount(booking: Booking): number {
    const price = booking.finalPrice ?? 0;
    const deposit = booking.depositStatus === 'captured' ? (booking.deposit?.amount ?? 0) : 0;
    const remainder = booking.status === 'completed' ? Math.max(0, price - deposit) : 0;
    return deposit + remainder;
  }

  /** Доступне до повернення з durable-платежів; fallback — снепшот візиту. */
  async availableRefundTotal(booking: Booking): Promise<number> {
    if (!this.payments) return this.capturedAmount(booking);
    const payments = await this.payments.findByAppointmentId(booking.id);
    return payments
      .filter((payment) => isCapturedPaymentStatus(payment.status))
      .reduce((total, payment) => total + Math.max(0, payment.amount - payment.refundedAmount), 0);
  }

  private async settle(booking: Booking, at: Date): Promise<RefundEntity> {
    const refundId = booking.refundId ?? uuidv7();
    const amount = booking.capturedRefundAmount ?? 0;
    const metadata = readMetadata(booking.refundMetadata);
    let relatedReceiptId: string | undefined;

    if (this.payments && this.acquiring) {
      const outcome = await this.refundPayments(booking, refundId, amount, metadata);
      if (outcome.failed) return this.toEntity(booking);
      relatedReceiptId = outcome.relatedReceiptId;
    }

    const result = await this.gateway
      .issueRefundReceipt({
        refundId,
        bookingId: booking.id,
        amount,
        ...(relatedReceiptId ? { relatedReceiptId } : {}),
      })
      .catch((error: unknown) => ({
        receiptId: '',
        status: 'failed' as const,
        error: error instanceof Error ? error.message : String(error),
      }));

    if (result.status === 'done') {
      booking.refundStatus = RefundStatus.COMPLETED;
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.note;
      booking.refundMetadata = JSON.stringify({
        ...cleanMetadata,
        receiptId: result.receiptId,
        completedAt: at.toISOString(),
      });
      await this.bookingRepo.save(booking);
      return this.toEntity(booking);
    }

    booking.refundStatus = RefundStatus.FAILED;
    booking.refundMetadata = JSON.stringify({
      ...metadata,
      note: result.error ?? 'expenditure receipt failed',
    });
    await this.bookingRepo.save(booking);
    return this.toEntity(booking);
  }

  /**
   * Розподіляє повернення між списаними платежами. Кожен платіж отримує
   * стабільний idempotency key; успішні алокації зберігаються в metadata, щоб
   * повтор після збою не повертав ті самі гроші вдруге.
   */
  private async refundPayments(
    booking: Booking,
    refundId: string,
    amount: number,
    metadata: RefundMetadataRecord
  ): Promise<{ failed: boolean; relatedReceiptId?: string }> {
    const paymentRepo = this.payments;
    const acquiring = this.acquiring;
    if (!paymentRepo || !acquiring) {
      return this.failRefund(booking, metadata, [], 'acquiring_not_configured');
    }
    const payments = await paymentRepo.findByAppointmentId(booking.id);
    let allocations = metadata.allocations ?? [];
    let remaining = amount - allocations.reduce((sum, item) => sum + item.amount, 0);

    for (const payment of payments) {
      if (remaining <= 0) break;
      if (!isCapturedPaymentStatus(payment.status)) continue;
      const available = Math.max(0, payment.amount - payment.refundedAmount);
      if (available <= 0) continue;
      const portion = Math.min(available, remaining);
      try {
        const result = await acquiring.refundPayment({
          providerSessionId: payment.id,
          amount: portion,
          reason: booking.refundReason ?? 'refund',
          traceId: refundId,
          idempotencyKey: `${refundId}:${payment.id}`,
        });
        payment.initiateRefund(booking.refundReason ?? 'refund', portion);
        payment.completeRefund(result.refundId, portion);
        await paymentRepo.save(payment);
        allocations = [
          ...allocations,
          { paymentId: payment.id, amount: portion, refundId: result.refundId },
        ];
        remaining -= portion;
        metadata.allocations = allocations;
        booking.refundMetadata = JSON.stringify(metadata);
        await this.bookingRepo.save(booking);
      } catch (error) {
        return this.failRefund(
          booking,
          metadata,
          allocations,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    if (remaining > 0) {
      return this.failRefund(booking, metadata, allocations, 'no_captured_payment_balance');
    }
    const relatedReceiptId = payments.find((payment) => payment.receiptId)?.receiptId;
    return { failed: false, ...(relatedReceiptId ? { relatedReceiptId } : {}) };
  }

  private async failRefund(
    booking: Booking,
    metadata: RefundMetadataRecord,
    allocations: RefundAllocation[],
    reason: string
  ): Promise<{ failed: true }> {
    booking.refundStatus = RefundStatus.FAILED;
    booking.refundMetadata = JSON.stringify({ ...metadata, allocations, note: reason });
    await this.bookingRepo.save(booking);
    return { failed: true };
  }

  private applyToBooking(
    booking: Booking,
    input: {
      refundId: string;
      status: RefundStatus;
      amount: number;
      reason: RefundReason;
      reasonCode?: string;
      at: Date;
      metadata: RefundMetadataRecord;
    }
  ): void {
    booking.refundId = input.refundId;
    booking.refundStatus = input.status;
    booking.refundInitiatedAt = input.at;
    booking.refundReason = input.reason;
    booking.refundReasonCode = input.reasonCode ?? null;
    booking.capturedRefundAmount = input.amount;
    booking.refundMetadata = JSON.stringify(input.metadata);
  }

  private toEntity(booking: Booking): RefundEntity {
    const metadata = readMetadata(booking.refundMetadata);
    const status = (booking.refundStatus as RefundStatus | null) ?? RefundStatus.PENDING;
    const entity: RefundEntity = {
      refundId: booking.refundId ?? '',
      bookingId: booking.id,
      amount: booking.capturedRefundAmount ?? 0,
      reason: (booking.refundReason as RefundReason | null) ?? RefundReason.SYSTEM_ERROR,
      status,
      initiatedAt: booking.refundInitiatedAt ?? this.now(),
      paymentMethod: refundMethodOf(booking.paymentMethod),
      refundIdempotencyKey: booking.refundId ?? '',
      checksum: `${booking.id}:${booking.refundId ?? ''}:${booking.capturedRefundAmount ?? 0}`,
    };
    if (metadata.completedAt) entity.completedAt = new Date(metadata.completedAt);
    if (booking.refundReasonCode) entity.reasonCode = booking.refundReasonCode;
    if (metadata.note) entity.adminNote = metadata.note;
    return entity;
  }

  private async findByRefundId(refundId: string): Promise<Booking | null> {
    if (!this.bookingRepo.findByRefundId) {
      throw new Error('Refund lookup by id is not supported by this booking repository');
    }
    return this.bookingRepo.findByRefundId(refundId);
  }
}
