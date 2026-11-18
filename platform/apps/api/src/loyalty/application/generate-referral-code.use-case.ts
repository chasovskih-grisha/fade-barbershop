// Generate Referral Code (T-142): Formalizes the referral program that completes
// the visit loop: book → attend → feedback → loyalty points → referral.
// A client gets a unique referral code; both sides earn loyalty points when the
// referee completes their first visit.

import { prisma } from '../../index';
import { DomainEvent } from '../domain/domain-event';
import { LoyaltyPointsEarned } from '../domain/loyalty-events';

export interface GenerateReferralCodeInput {
  clientId: string;
  occurredAt: Date;
}

export interface GenerateReferralCodeOutput {
  clientId: string;
  referralCode: string;
  referrerId: string;
  status: 'generated' | 'already_exists';
  occurredAt: Date;
}

export class GenerateReferralCodeHandler {
  async handle(input: GenerateReferralCodeInput): Promise<GenerateReferralCodeOutput> {
    // 1. Check if referrer already has a referral code
    const existing = await prisma.referralCode.findFirst({
      where: { referrerId: input.clientId },
    });

    if (existing) {
      return {
        clientId: input.clientId,
        referralCode: existing.code,
        referrerId: input.clientId,
        status: 'already_exists',
        occurredAt: input.occurredAt,
      };
    }

    // 2. Generate unique referral code (8-char alphanumeric)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const code = `FADE-${timestamp}-${random}`.toUpperCase().substring(0, 8);

    // 3. Create referral code record
    await prisma.referralCode.create({
      data: {
        id: code,
        referrerId: input.clientId,
        code,
        status: 'active',
        uses: 0,
        createdAt: new Date(),
      },
    });

    // Also update client profile with referral code
    await prisma.clientProfile.upsert({
      where: { clientId: input.clientId },
      update: { referralCode: code },
      create: {
        clientId: input.clientId,
        referralCode: code,
        loyaltyVisitsCount: 0,
      },
    });

    return {
      clientId: input.clientId,
      referralCode: code,
      referrerId: input.clientId,
      status: 'generated',
      occurredAt: input.occurredAt,
    };
  }
}