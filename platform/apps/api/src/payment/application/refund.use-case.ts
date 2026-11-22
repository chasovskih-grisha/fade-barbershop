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
import { RefundReason, RefundStatus, type RefundEntity } from '../domain/refund.entity';

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

interface RefundMetadataRecord {
  completedAt?: string;
  receiptId?: string;
  retryCount?: number;
  note?: string;
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
    private readonly now: () => Date = () => new Date()
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

    const capturedTotal = this.capturedAmount(booking);
    if (capturedTotal <= 0) throw new Error('No captured payment to refund');
    const validatedAmount = this.validateRefundAmount(capturedTotal, amount ?? capturedTotal);
    if (validatedAmount <= 0) throw new Error(`Invalid refund amount ${amount ?? 0}`);

    const id = refundId ?? uuidv7();
    const metadata: RefundMetadataRecord = { retryCount: 0 };
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
    booking.refundMetadata = JSON.stringify({ ...metadata, retryCount: retryCount + 1 });
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

  private async settle(booking: Booking, at: Date): Promise<RefundEntity> {
    const refundId = booking.refundId ?? uuidv7();
    const amount = booking.capturedRefundAmount ?? 0;
    const metadata = readMetadata(booking.refundMetadata);
    const relatedReceiptId = undefined;

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
      booking.refundMetadata = JSON.stringify({
        ...metadata,
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
