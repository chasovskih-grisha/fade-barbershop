import { Injectable } from '@nestjs/common';
import type { Payment as PaymentRow } from '@prisma/client';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import type { AppointmentPaymentRepository } from '../application/deposit-flow.use-case';
import { PrismaService } from '../../shared/prisma/prisma.service';

/** Prisma-адаптер журналу платежів (порт DepositFlow лишається незмінним). */
@Injectable()
export class PrismaAppointmentPaymentRepository implements AppointmentPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(payment: Payment): Promise<void> {
    const props = payment.toJSON();
    const data = {
      appointmentId: props.appointmentId ?? null,
      orderId: props.orderId ?? null,
      clientId: props.clientId || null,
      amount: props.amount,
      form: props.form,
      status: props.status,
      traceId: props.traceId,
      receiptId: props.receiptId ?? null,
      refundReason: props.refundReason ?? null,
      refundedAmount: props.refundedAmount ?? 0,
      retryCount: props.retryCount ?? 0,
      updatedAt: new Date(),
    };
    await this.prisma.payment.upsert({
      where: { id: props.id },
      create: { id: props.id, createdAt: props.createdAt, ...data },
      update: data,
    });
  }

  private toEntity(row: PaymentRow): Payment {
    return new Payment({
      id: row.id,
      ...(row.appointmentId ? { appointmentId: row.appointmentId } : {}),
      ...(row.orderId ? { orderId: row.orderId } : {}),
      clientId: row.clientId ?? '',
      amount: row.amount,
      form: row.form as PaymentForm,
      status: row.status as PaymentStatus,
      traceId: row.traceId,
      ...(row.receiptId ? { receiptId: row.receiptId } : {}),
      ...(row.refundReason ? { refundReason: row.refundReason } : {}),
      refundedAmount: row.refundedAmount,
      retryCount: row.retryCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
