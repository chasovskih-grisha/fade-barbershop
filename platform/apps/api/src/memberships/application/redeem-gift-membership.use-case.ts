/* eslint-disable max-params -- 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { MembershipInstance } from '../domain/membership-instance.entity';
import { GiftMembershipRedeemedEvent, MembershipPurchasedEvent } from '../domain/membership-events';
import {
  GiftMembershipRepository,
  MembershipPlanRepository,
  MembershipInstanceRepository,
  OutboxPublisher,
  Clock,
} from '../domain/ports';

export interface RedeemGiftMembershipInput {
  code: string;
  clientId: string;
  membershipInstanceId: string;
}

export class RedeemGiftMembershipUseCase {
  constructor(
    private readonly giftRepo: GiftMembershipRepository,
    private readonly planRepo: MembershipPlanRepository,
    private readonly instanceRepo: MembershipInstanceRepository,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock
  ) {}

  async handle(input: RedeemGiftMembershipInput): Promise<MembershipInstance> {
    const now = this.clock.now();
    const cleanCode = input.code.trim().toUpperCase();
    const gift = await this.giftRepo.findByCode(cleanCode);

    if (!gift) {
      throw new Error(`Gift membership with code '${cleanCode}' not found`);
    }

    gift.redeem(input.clientId, now);

    const plan = await this.planRepo.findById(gift.planId);
    if (!plan) {
      throw new Error(`Associated membership plan '${gift.planId}' not found`);
    }

    const instance = MembershipInstance.createNew({
      id: input.membershipInstanceId,
      clientId: input.clientId,
      planId: plan.id,
      durationDays: plan.durationDays,
      visitLimit: plan.visitLimit,
      now,
    });

    await this.giftRepo.save(gift);
    await this.instanceRepo.save(instance);

    await this.outbox.append([
      new GiftMembershipRedeemedEvent(
        {
          giftId: gift.id,
          code: gift.code,
          planId: gift.planId,
          redeemedByClientId: input.clientId,
          membershipInstanceId: instance.id,
        },
        now
      ),
      new MembershipPurchasedEvent(
        {
          membershipId: instance.id,
          clientId: instance.clientId,
          planId: instance.planId,
          startDate: instance.startDate,
          endDate: instance.endDate,
          visitLimit: instance.visitLimit,
        },
        now
      ),
    ]);

    return instance;
  }
}
