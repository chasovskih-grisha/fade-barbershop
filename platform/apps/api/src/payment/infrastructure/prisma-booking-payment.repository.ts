/* eslint-disable complexity -- one explicit row→aggregate overlay; splitting it would hide which persisted fields are restored. */
import { Injectable } from '@nestjs/common';
import type { Booking as BookingRow, BookingPaymentState } from '@prisma/client';
import { Booking, type BookingSource } from '../../scheduling/domain/booking';
import type { BookingPaymentPort } from '../application/deposit-flow.use-case';
import type { RefundBookingPort } from '../application/refund.use-case';
import { depositOf, discountsOf } from '../../scheduling/infrastructure/booking-row-mappers';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Booking persistence for the payment flows: booking rows stay owned by
 * scheduling, while payment/refund fields live in BookingPaymentState so the
 * ports can read and save the aggregate without changing Booking columns.
 */
@Injectable()
export class PrismaBookingPaymentRepository implements BookingPaymentPort, RefundBookingPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Booking | null> {
    const row = await this.prisma.booking.findUnique({ where: { id } });
    if (!row) return null;
    const state = await this.prisma.bookingPaymentState.findUnique({ where: { bookingId: id } });
    return this.restore(row, state);
  }

  async findByRefundId(refundId: string): Promise<Booking | null> {
    const state = await this.prisma.bookingPaymentState.findUnique({ where: { refundId } });
    return state ? this.findById(state.bookingId) : null;
  }

  async save(booking: Booking): Promise<void> {
    const state = {
      status: booking.status,
      requiresPayment: booking.requiresPayment,
      paymentMethod: booking.paymentMethod,
      depositStatus: booking.depositStatus,
      discountReason: booking.discountReason,
      refundId: booking.refundId,
      refundStatus: booking.refundStatus,
      refundInitiatedAt: booking.refundInitiatedAt,
      refundReason: booking.refundReason,
      refundReasonCode: booking.refundReasonCode,
      refundMetadata: booking.refundMetadata,
      capturedRefundAmount: booking.capturedRefundAmount,
    };
    await this.prisma.$transaction([
      this.prisma.bookingPaymentState.upsert({
        where: { bookingId: booking.id },
        create: { bookingId: booking.id, ...state },
        update: state,
      }),
      this.prisma.booking.update({ where: { id: booking.id }, data: { status: booking.status } }),
    ]);
  }

  private restore(row: BookingRow, state: BookingPaymentState | null): Booking {
    return Booking.reconstitute({
      id: row.id,
      barberId: row.barberId,
      locationId: row.locationId,
      serviceId: row.serviceId,
      agreedPrice: row.agreedPrice,
      appliedDiscounts: discountsOf(row.appliedDiscounts),
      finalPrice: row.finalPrice,
      agreedDuration: row.agreedDuration,
      fulfillmentMode: row.fulfillmentMode as 'sequential' | 'parallel' | null,
      start: row.start,
      end: row.end,
      version: row.version,
      haircutReferenceId: row.haircutReferenceId,
      appointmentComment: row.appointmentComment,
      clientId: row.clientId,
      source: row.source as BookingSource,
      deposit: depositOf(row),
      status: state?.status ?? row.status,
      ...(state?.requiresPayment != null ? { requiresPayment: state.requiresPayment } : {}),
      ...(state?.paymentMethod ? { paymentMethod: state.paymentMethod } : {}),
      ...(state?.depositStatus ? { depositStatus: state.depositStatus } : {}),
      ...(state?.discountReason ? { discountReason: state.discountReason } : {}),
      ...(state?.refundId ? { refundId: state.refundId } : {}),
      ...(state?.refundStatus ? { refundStatus: state.refundStatus } : {}),
      ...(state?.refundInitiatedAt ? { refundInitiatedAt: state.refundInitiatedAt } : {}),
      ...(state?.refundReason ? { refundReason: state.refundReason } : {}),
      ...(state?.refundReasonCode ? { refundReasonCode: state.refundReasonCode } : {}),
      ...(state?.refundMetadata ? { refundMetadata: state.refundMetadata } : {}),
      ...(state?.capturedRefundAmount != null
        ? { capturedRefundAmount: state.capturedRefundAmount }
        : {}),
    });
  }
}
