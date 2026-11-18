import { WinbackCampaign, SegmentType } from '../domain/campaign.entity';

export interface CampaignRepository {
  save(campaign: WinbackCampaign): Promise<void>;
  findById(id: string): Promise<WinbackCampaign | null>;
  findByCode(code: string): Promise<WinbackCampaign | null>;
  findAll(): Promise<WinbackCampaign[]>;
  findBySegment(segment: SegmentType): Promise<WinbackCampaign[]>;
}
