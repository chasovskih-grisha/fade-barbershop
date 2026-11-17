export interface CampaignSentRecord {
  id: string;
  campaignId: string;
  clientId: string;
  sentAt: Date;
}

export interface CampaignSentRepository {
  record(record: CampaignSentRecord): Promise<void>;
  wasSentWithinDays(clientId: string, campaignId: string, days: number): Promise<boolean>;
}
