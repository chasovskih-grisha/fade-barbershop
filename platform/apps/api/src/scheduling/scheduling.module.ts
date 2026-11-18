import { Module } from '@nestjs/common';
import { WaitlistDepositController } from './application/waitlist-deposit.controller';
import { WaitlistDepositFlow } from '../payment/application/waitlist-deposit-flow.use-case';
import { BookingModule } from '../booking/booking.module';
import { DepositPolicyProvider } from './infrastructure/deposit-policy.provider';

@Module({
  imports: [
    BookingModule,
  ],
  controllers: [
    WaitlistDepositController,
  ],
  providers: [
    WaitlistDepositFlow,
    DepositPolicyProvider,
  ],
  exports: [
    WaitlistDepositFlow,
  ],
})
export class SchedulingModule {}