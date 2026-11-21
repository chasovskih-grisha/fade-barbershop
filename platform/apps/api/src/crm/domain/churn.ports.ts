import { ChurnPropensityScore } from '../domain/churn-propensity.entity';

export interface ChurnPredictorPort {
  computePropensity(clientId: string): Promise<ChurnPropensityScore>;
  computeAllActiveClients(): Promise<ChurnPropensityScore[]>;
}

export interface WinBackCampaignPort {
  triggerWinBackCampaign(
    clientId: string,
    score: ChurnPropensityScore
  ): Promise<{
    campaignId: string;
    discountPercent: number;
    channelsTriggered: string[];
  }>;
}
