import { Module } from '@nestjs/common';
import { MembershipController } from './membership.controller';
import { PurchaseMembershipUseCase } from './application/purchase-membership.use-case';
import { UseMembershipVisitUseCase } from './application/use-membership-visit.use-case';
import { PauseMembershipUseCase } from './application/pause-resume-membership.use-case';
import { ResumeMembershipUseCase } from './application/pause-resume-membership.use-case';
import { PurchaseGiftMembershipUseCase } from './application/purchase-gift-membership.use-case';
import { RedeemGiftMembershipUseCase } from './application/redeem-gift-membership.use-case';

@Module({
  controllers: [MembershipController],
  providers: [
    PurchaseMembershipUseCase,
    UseMembershipVisitUseCase,
    PauseMembershipUseCase,
    ResumeMembershipUseCase,
    PurchaseGiftMembershipUseCase,
    RedeemGiftMembershipUseCase,
  ],
  exports: [MembershipController],
})
export class MembershipModule {}
