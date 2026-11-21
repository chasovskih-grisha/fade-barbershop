/* eslint-disable max-params -- 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { GiftMembership } from '../domain/gift-membership.entity';
import { GiftMembershipPurchasedEvent } from '../domain/gift-membership-events';
import {
  MembershipPlanRepository,
  GiftMembershipRepository,
  MembershipCodeGenerator,
  OutboxPublisher,
  Clock,
} from '../domain/ports';

export interface PurchaseGiftMembershipInput {
  giftId: string;
  planId: string;
  purchaserClientId: string;
  recipientEmail?: string;
  validityDays?: number;
}

export class PurchaseGiftMembershipUseCase {
  constructor(
    private readonly planRepo: MembershipPlanRepository,
    private readonly giftRepo: GiftMembershipRepository,
    private readonly codeGen: MembershipCodeGenerator,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock
  ) {}

  async handle(input: PurchaseGiftMembershipInput): Promise<GiftMembership> {
    const now = this.clock.now();
    const plan = await this.planRepo.findById(input.planId);
    if (!plan || !plan.isActive) {
      throw new Error(`Membership plan with ID '${input.planId}' not found or inactive`);
    }

    const code = this.codeGen.generateCode();
    const gift = GiftMembership.createNew({
      id: input.giftId,
      code,
      planId: input.planId,
      purchaserClientId: input.purchaserClientId,
      ...(input.recipientEmail ? { recipientEmail: input.recipientEmail } : {}),
      ...(input.validityDays !== undefined ? { validityDays: input.validityDays } : {}),
      now,
    });

    await this.giftRepo.save(gift);

    await this.outbox.append([
      new GiftMembershipPurchasedEvent(
        {
          giftId: gift.id,
          code: gift.code,
          planId: gift.planId,
          purchaserClientId: gift.purchaserClientId,
          ...(gift.recipientEmail ? { recipientEmail: gift.recipientEmail } : {}),
          expiresAt: gift.expiresAt,
        },
        now
      ),
    ]);

    return gift;
  }
}
