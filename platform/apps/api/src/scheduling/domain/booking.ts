/* eslint-disable max-lines -- cohesive module (173 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import {
  newBookingData,
  type BookingCreateParams,
  type BookingData,
  type BookingSource,
} from './booking.data';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { DepositTerms } from './deposit-terms';
import type { ServicePosition } from './composed-slot-span';

export type { BookingData, BookingSource };
export type { BookingCreateParams };
/** Порт сховища візитів — спільний з book-appointment (T-046). */
export type { BookingRepository } from './booking-repository';
/** Статус грошового кроку візиту (PAY-ADM-09). */
export { PaymentStatus } from './payment-status';

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class Booking {
  constructor(private data: BookingData) {}

  static create(params: BookingCreateParams): Booking {
    return new Booking(newBookingData(params));
  }

  static reconstitute(data: BookingData): Booking {
    return new Booking(data);
  }

  get id(): string {
    return this.data.id;
  }
  get barberId(): string {
    return this.data.barberId;
  }
  get locationId(): string {
    return this.data.locationId;
  }
  get serviceId(): string | null {
    return this.data.serviceId ?? null;
  }
  get agreedPrice(): number | null {
    return this.data.agreedPrice ?? null;
  }
  /** Снепшот знижок на момент запису (T-090, ADR 0007); null — знижок немає. */
  get appliedDiscounts(): AppliedDiscount[] | null {
    return this.data.appliedDiscounts ?? null;
  }
  /** Підсумкова ціна візиту (DSC-004): AgreedPrice − Σ AppliedDiscounts, ≥ 0. */
  get finalPrice(): number | null {
    return this.data.finalPrice ?? null;
  }
  /** Снепшот surge (T-4811): множник, застосований до базової ціни. */
  get surgeBasisPoints(): number | null {
    return this.data.surgeBasisPoints ?? null;
  }
  get surgeRuleId(): string | null {
    return this.data.surgeRuleId ?? null;
  }
  get agreedDuration(): number | null {
    return this.data.agreedDuration ?? null;
  }
  get fulfillmentMode(): 'sequential' | 'parallel' | null {
    return this.data.fulfillmentMode ?? null;
  }
  /** Позиції послуг композитного слота (T-4520a). */
  get servicePositions(): ServicePosition[] | null {
    return this.data.servicePositions ?? null;
  }
  get start(): Date {
    return this.data.start;
  }
  get end(): Date {
    return this.data.end;
  }
  get version(): number {
    return this.data.version;
  }
  get haircutReferenceId(): string | null {
    return this.data.haircutReferenceId ?? null;
  }
  get appointmentComment(): string | null {
    return this.data.appointmentComment ?? null;
  }
  get clientId(): string | null {
    return this.data.clientId ?? null;
  }
  get source(): string {
    return this.data.source ?? 'web';
  }
  /** Снепшот умов депозиту на момент запису; null — грошей у візиті немає. */
  get deposit(): DepositTerms | null {
    return this.data.deposit ?? null;
  }
  /** Життєвий статус візиту (T-095); за замовчуванням — confirmed. */
  get status(): string {
    return this.data.status ?? 'confirmed';
  }
  set status(value: string) {
    this.data.status = value;
  }
  /**
   * Чи візит вимагає оплати (T-092): явний снепшот має пріоритет, інакше —
   * будь-яка додатна ціна візиту.
   */
  get requiresPayment(): boolean {
    if (this.data.requiresPayment != null) return this.data.requiresPayment;
    return (this.data.finalPrice ?? this.data.agreedPrice ?? 0) > 0;
  }
  /** Причина нульової доплати (T-092), напр. full_discount_promo. */
  get discountReason(): string | null {
    return this.data.discountReason ?? null;
  }
  get paymentMethod(): string | null {
    return this.data.paymentMethod ?? null;
  }
  set paymentMethod(value: string | null) {
    this.data.paymentMethod = value;
  }
  get depositStatus(): string | null {
    return this.data.depositStatus ?? null;
  }
  set depositStatus(value: string | null) {
    this.data.depositStatus = value;
  }

  /** No-show ескалація (T-095). */
  get noShowStatus(): string | null {
    return this.data.noShowStatus ?? null;
  }
  set noShowStatus(value: string | null) {
    this.data.noShowStatus = value;
  }
  get noShowEscalatedAt(): Date | null {
    return this.data.noShowEscalatedAt ?? null;
  }
  set noShowEscalatedAt(value: Date | null) {
    this.data.noShowEscalatedAt = value;
  }
  get noShowRefundId(): string | null {
    return this.data.noShowRefundId ?? null;
  }
  set noShowRefundId(value: string | null) {
    this.data.noShowRefundId = value;
  }

  /** Повернення коштів за візит (T-094/T-095). */
  get refundStatus(): string | null {
    return this.data.refundStatus ?? null;
  }
  set refundStatus(value: string | null) {
    this.data.refundStatus = value;
  }
  get refundInitiatedAt(): Date | null {
    return this.data.refundInitiatedAt ?? null;
  }
  set refundInitiatedAt(value: Date | null) {
    this.data.refundInitiatedAt = value;
  }
  get refundReason(): string | null {
    return this.data.refundReason ?? null;
  }
  set refundReason(value: string | null) {
    this.data.refundReason = value;
  }
  get refundReasonCode(): string | null {
    return this.data.refundReasonCode ?? null;
  }
  set refundReasonCode(value: string | null) {
    this.data.refundReasonCode = value;
  }
  get refundMetadata(): string | null {
    return this.data.refundMetadata ?? null;
  }
  set refundMetadata(value: string | null) {
    this.data.refundMetadata = value;
  }
  get capturedRefundAmount(): number | null {
    return this.data.capturedRefundAmount ?? null;
  }
  set capturedRefundAmount(value: number | null) {
    this.data.capturedRefundAmount = value;
  }
  get refundId(): string | null {
    return this.data.refundId ?? null;
  }
  set refundId(value: string | null) {
    this.data.refundId = value;
  }
}
