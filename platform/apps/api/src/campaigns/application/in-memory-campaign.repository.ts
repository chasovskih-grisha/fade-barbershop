import { WinbackCampaign, SegmentType } from '../domain/campaign.entity';
import type { CampaignRepository } from './campaign.repository';

export class InMemoryCampaignRepository implements CampaignRepository {
  private campaigns = new Map<string, WinbackCampaign>();

  async save(campaign: WinbackCampaign): Promise<void> {
    this.campaigns.set(campaign.id, campaign);
  }

  async findById(id: string): Promise<WinbackCampaign | null> {
    return this.campaigns.get(id) ?? null;
  }

  async findByCode(code: string): Promise<WinbackCampaign | null> {
    for (const cmp of this.campaigns.values()) {
      if (cmp.discountCode === code) return cmp;
    }
    return null;
  }

  async findAll(): Promise<WinbackCampaign[]> {
    return Array.from(this.campaigns.values());
  }

  async findBySegment(segment: SegmentType): Promise<WinbackCampaign[]> {
    const result: WinbackCampaign[] = [];
    for (const cmp of this.campaigns.values()) {
      if (cmp.segment === segment) result.push(cmp);
    }
    return result;
  }
}
