import { WinbackCampaign, SegmentType } from '../domain/campaign.entity';
import type { CampaignRepository } from './campaign.repository';

export class CreateWinbackCampaignUseCase {
  constructor(private readonly campaignRepo: CampaignRepository) {}

  async execute(input: {
    name: string;
    segment: SegmentType;
    discountPercent: number;
    validDays: number;
    targetCount: number;
  }): Promise<WinbackCampaign> {
    if (input.discountPercent <= 0 || input.discountPercent > 50) {
      throw new Error('Discount percent must be between 1 and 50');
    }
    const campaign = WinbackCampaign.create(
      input.name,
      input.segment,
      input.discountPercent,
      input.validDays,
      input.targetCount
    );
    campaign.activate();
    await this.campaignRepo.save(campaign);
    return campaign;
  }
}

export class SendWinbackCampaignUseCase {
  constructor(private readonly campaignRepo: CampaignRepository) {}

  async execute(input: { campaignId: string; clientCount: number }): Promise<WinbackCampaign> {
    const campaign = await this.campaignRepo.findById(input.campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.lastSentAt) {
      const hoursSinceLastSend =
        (new Date().getTime() - campaign.lastSentAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSend < 720) {
        // 30 days anti-spam throttle rule (WNB-006)
        throw new Error(
          'Anti-spam rule: campaign cannot be resent within 30 days to the same segment'
        );
      }
    }

    campaign.recordSend(input.clientCount);
    await this.campaignRepo.save(campaign);
    return campaign;
  }
}

export class TrackCampaignUsageUseCase {
  constructor(private readonly campaignRepo: CampaignRepository) {}

  async execute(input: { discountCode: string; revenueAmount: number }): Promise<WinbackCampaign> {
    const campaign = await this.campaignRepo.findByCode(input.discountCode);
    if (!campaign) {
      throw new Error('Campaign or discount code not found');
    }

    campaign.recordUsage(input.revenueAmount);
    await this.campaignRepo.save(campaign);
    return campaign;
  }
}
