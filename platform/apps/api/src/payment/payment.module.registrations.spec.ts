// T-091/T-093/T-4619: реєстрації PaymentModule, які раніше жили лише в робочій
// копії. Компіляція контейнера падає, якщо провайдера немає, а get() — якщо
// реєстрація резолвиться в undefined. Тому «зелено» тут означає справжню збірку,
// а не тест-дубль.
import { Test } from '@nestjs/testing';
import { AdminBarberUnavailabilityController } from '../scheduling/infrastructure/admin-barber-unavailability.controller';
import { ClientSessionGuard } from '../identity/infrastructure/client-session.guard';
import { PrismaSessionRepository } from '../identity/infrastructure/prisma-session-repository';
import { ProcessStripeWebhookHandler } from '../billing/application/process-stripe-webhook.use-case';
import { PaymentModule } from './payment.module';
import { BarberCancelSettlement } from './application/barber-cancel-settlement.use-case';
import { BarberDayMoney } from './application/barber-day-money.use-case';
import { SettleWebhookCapture } from './application/settle-webhook-capture.use-case';
import { AdminPaymentsController } from './infrastructure/admin-payments.controller';
import { BarberPaymentsController } from './infrastructure/barber-payments.controller';
import { PrismaBarberDayMoneyRepository } from './infrastructure/prisma-barber-day-money.repository';
import { PrismaBillingOutboxPublisher } from './infrastructure/prisma-billing-outbox.publisher';
import { PrismaBillingPaymentRepository } from './infrastructure/prisma-billing-payment.repository';
import { StripeWebhookController } from './infrastructure/stripe-webhook.controller';

describe('PaymentModule registrations (T-091/T-093/T-4619)', () => {
  it('піднімає кожен новий контролер і провайдер зі справжнього контейнера', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PaymentModule] }).compile();

    for (const token of [
      AdminPaymentsController,
      BarberPaymentsController,
      StripeWebhookController,
      AdminBarberUnavailabilityController,
      BarberCancelSettlement,
      BarberDayMoney,
      SettleWebhookCapture,
      ProcessStripeWebhookHandler,
      PrismaBillingPaymentRepository,
      PrismaBillingOutboxPublisher,
      PrismaBarberDayMoneyRepository,
      PrismaSessionRepository,
      ClientSessionGuard,
    ]) {
      expect(moduleRef.get(token, { strict: false })).toBeInstanceOf(token as never);
    }

    await moduleRef.close();
  });
});
