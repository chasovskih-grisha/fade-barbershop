import { Module } from '@nestjs/common';
import { WaitlistDepositController } from './application/waitlist-deposit.controller';
import { AdminWaitlistController } from './application/admin-waitlist.controller';
import {
  InMemoryWaitlistExtendedRepository,
  ManageWaitlistService,
  WAITLIST_EXTENDED_REPOSITORY,
} from './application/manage-waitlist.use-case';
import {
  WaitlistDepositFlow,
  createInMemoryWaitlistPaymentRepository,
  type WaitlistDepositDeps,
  type WaitlistPaymentRepository,
} from '../payment/application/waitlist-deposit-flow.use-case';
import {
  DepositSettlementService,
  type DepositSettlementDeps,
  type SettlementPaymentRepository,
} from './application/deposit-settlement.service';
import {
  ClientScheduleChangeController,
  AdminScheduleChangeController,
} from './infrastructure/schedule-change.controller';
import {
  InMemoryScheduleChangeRepository,
  SCHEDULE_CHANGE_AVAILABILITY,
  SCHEDULE_CHANGE_CLOCK,
  SCHEDULE_CHANGE_EVENTS,
  SCHEDULE_CHANGE_REPOSITORY,
  ScheduleChangeApprovalService,
} from './application/schedule-change-approval.service';
import { PrismaScheduleChangeAvailability } from './infrastructure/prisma-schedule-change.availability';
import { RecordingScheduleChangeEvents } from './infrastructure/recording-schedule-change.events';
import { BookingModule } from '../booking/booking.module';
import { DepositPolicyProvider } from './infrastructure/deposit-policy.provider';

/**
 * Провайдери грошової гілки запису (T-197, T-160).
 *
 * Репозиторій платежів поки живе в памʼяті: у Prisma-схемі ще немає моделі
 * Payment (billing-персистенція окремим слайсом), тож підмінювати її фейком
 * було б гірше, ніж явно тримати контракт. Коли зʼявиться адаптер, зміниться
 * лише значення WAITLIST_PAYMENT_REPOSITORY.
 */
export const WAITLIST_PAYMENT_REPOSITORY = Symbol('WAITLIST_PAYMENT_REPOSITORY');
export const WAITLIST_DEPOSIT_DEPS = Symbol('WAITLIST_DEPOSIT_DEPS');
export const DEPOSIT_SETTLEMENT_DEPS = Symbol('DEPOSIT_SETTLEMENT_DEPS');

@Module({
  imports: [BookingModule],
  controllers: [
    WaitlistDepositController,
    AdminWaitlistController,
    ClientScheduleChangeController,
    AdminScheduleChangeController,
  ],
  providers: [
    {
      provide: WAITLIST_PAYMENT_REPOSITORY,
      useFactory: (): WaitlistPaymentRepository => createInMemoryWaitlistPaymentRepository(),
    },
    {
      provide: WAITLIST_DEPOSIT_DEPS,
      useFactory: (paymentRepo: WaitlistPaymentRepository): WaitlistDepositDeps => ({
        paymentRepo,
        depositPolicy: async () => DepositPolicyProvider.get(),
      }),
      inject: [WAITLIST_PAYMENT_REPOSITORY],
    },
    {
      provide: WaitlistDepositFlow,
      useFactory: (deps: WaitlistDepositDeps) => new WaitlistDepositFlow(deps),
      inject: [WAITLIST_DEPOSIT_DEPS],
    },
    // T-4458: погодження зміни графіка — заявка → рішення → згода клієнта.
    RecordingScheduleChangeEvents,
    { provide: SCHEDULE_CHANGE_EVENTS, useExisting: RecordingScheduleChangeEvents },
    PrismaScheduleChangeAvailability,
    { provide: SCHEDULE_CHANGE_AVAILABILITY, useExisting: PrismaScheduleChangeAvailability },
    {
      provide: SCHEDULE_CHANGE_REPOSITORY,
      useClass: InMemoryScheduleChangeRepository,
    },
    { provide: SCHEDULE_CHANGE_CLOCK, useFactory: () => ({ now: () => new Date() }) },
    ScheduleChangeApprovalService,
    // T-4559: керована черга — пріоритети, каскад, відмова, дії адміна.
    ManageWaitlistService,
    {
      provide: WAITLIST_EXTENDED_REPOSITORY,
      useClass: InMemoryWaitlistExtendedRepository,
    },
    {
      provide: DEPOSIT_SETTLEMENT_DEPS,
      useFactory: (paymentRepo: WaitlistPaymentRepository): DepositSettlementDeps => {
        const settlementRepo: SettlementPaymentRepository = {
          load: async (id) => paymentRepo.findById?.(id) ?? null,
          save: async (payment) => {
            await paymentRepo.update(payment.id, payment.toJSON());
            return payment;
          },
        };
        return { payments: settlementRepo };
      },
      inject: [WAITLIST_PAYMENT_REPOSITORY],
    },
    {
      provide: DepositSettlementService,
      useFactory: (deps: DepositSettlementDeps) => new DepositSettlementService(deps),
      inject: [DEPOSIT_SETTLEMENT_DEPS],
    },
  ],
  exports: [WaitlistDepositFlow, DepositSettlementService, ScheduleChangeApprovalService],
})
export class SchedulingModule {}
