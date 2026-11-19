import { newBookingData, type BookingCreateParams, type BookingData, type BookingSource } from './booking.data';
import type { AppliedDiscount } from '../../discounts/domain/price-breakdown';
import type { DepositTerms } from './deposit-terms';

export type { BookingData, BookingSource };
export type { BookingCreateParams };

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class Booking {
  private constructor(private readonly data: BookingData) {}

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
  /** false — візит безкоштовний (100% знижка, DSC-013): без Payment і чека. */
  get requiresPayment(): boolean {
    return this.data.requiresPayment ?? true;
  }
  /** Причина безкоштовного візиту для екранів і адмінки (DSC-013). */
  get discountReason(): string | null {
    return this.data.discountReason ?? null;
  }
}
