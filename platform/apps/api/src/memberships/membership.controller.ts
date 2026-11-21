/* eslint-disable max-params -- 1 signature whose 6-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';

import { PurchaseMembershipUseCase } from './application/purchase-membership.use-case';
import { UseMembershipVisitUseCase } from './application/use-membership-visit.use-case';
import {
  PauseMembershipUseCase,
  ResumeMembershipUseCase,
} from './application/pause-resume-membership.use-case';
import { PurchaseGiftMembershipUseCase } from './application/purchase-gift-membership.use-case';
import { RedeemGiftMembershipUseCase } from './application/redeem-gift-membership.use-case';

@Controller('admin/memberships')
export class MembershipController {
  constructor(
    private readonly purchaseUseCase: PurchaseMembershipUseCase,
    private readonly useVisitUseCase: UseMembershipVisitUseCase,
    private readonly pauseUseCase: PauseMembershipUseCase,
    private readonly resumeUseCase: ResumeMembershipUseCase,
    private readonly purchaseGiftUseCase: PurchaseGiftMembershipUseCase,
    private readonly redeemGiftUseCase: RedeemGiftMembershipUseCase
  ) {}

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  async purchasePlan(@Body() body: { membershipId: string; clientId: string; planId: string }) {
    const instance = await this.purchaseUseCase.handle({
      membershipId: body.membershipId,
      clientId: body.clientId,
      planId: body.planId,
    });
    return { instance };
  }

  @Post('plans/:membershipId/visits')
  @HttpCode(HttpStatus.OK)
  async useVisit(@Param('membershipId') membershipId: string, @Body() body: { clientId: string }) {
    const result = await this.useVisitUseCase.handle({
      membershipId,
      clientId: body.clientId,
    });
    return { remainingVisits: result.remainingVisits };
  }

  @Post('plans/:membershipId/pause')
  @HttpCode(HttpStatus.OK)
  async pause(@Param('membershipId') membershipId: string, @Body() body: { clientId: string }) {
    await this.pauseUseCase.handle({ membershipId, clientId: body.clientId });
    return { status: 'paused' };
  }

  @Post('plans/:membershipId/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Param('membershipId') membershipId: string, @Body() body: { clientId: string }) {
    await this.resumeUseCase.handle({ membershipId, clientId: body.clientId });
    return { status: 'resumed' };
  }

  @Post('gifts')
  @HttpCode(HttpStatus.CREATED)
  async purchaseGift(
    @Body()
    body: {
      giftId: string;
      planId: string;
      purchaserClientId: string;
      recipientEmail: string;
      validityDays?: number;
    }
  ) {
    const gift = await this.purchaseGiftUseCase.handle({
      giftId: body.giftId,
      planId: body.planId,
      purchaserClientId: body.purchaserClientId,
      recipientEmail: body.recipientEmail,
      ...(body.validityDays !== undefined ? { validityDays: body.validityDays } : {}),
    });
    return { gift };
  }

  @Post('gifts/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemGift(@Body() body: { code: string; clientId: string; membershipInstanceId: string }) {
    const instance = await this.redeemGiftUseCase.handle({
      code: body.code,
      clientId: body.clientId,
      membershipInstanceId: body.membershipInstanceId,
    });
    return { instance };
  }
}
