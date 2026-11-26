// Адаптер порту billing `PaymentRepository` над тим самим журналом платежів,
// що й депозитний флоу: вебхук не має власного сховища.
//
// `findByProviderSessionId` повертає null: схема Payment поки не зберігає
// провайдерський session id (T-091 списує за payment id, metadata несе
// paymentId). Незматчену подію handler штатно відправляє в dead-letter, а не
// привʼязує гроші до чужого платежу.
import { Injectable } from '@nestjs/common';
import type { PaymentRepository } from '../../billing/domain/ports';
import type { Payment } from '../../billing/domain/payment.entity';
import { PrismaAppointmentPaymentRepository } from './prisma-appointment-payment.repository';

@Injectable()
export class PrismaBillingPaymentRepository implements PaymentRepository {
  constructor(private readonly payments: PrismaAppointmentPaymentRepository) {}

  findById(id: string): Promise<Payment | null> {
    return this.payments.findById(id);
  }

  save(payment: Payment): Promise<void> {
    return this.payments.save(payment);
  }

  async findByProviderSessionId(): Promise<Payment | null> {
    return null;
  }
}
