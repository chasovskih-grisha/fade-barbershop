import { ChurnPropensityScore } from '../domain/churn-propensity.entity';
import { ChurnPredictorPort, WinBackCampaignPort } from '../domain/churn.ports';

export class EvaluateChurnAndTriggerWinBackUseCase {
  constructor(
    private readonly churnPredictor: ChurnPredictorPort,
    private readonly winBackCampaign: WinBackCampaignPort,
  ) {}

  public async executeForClient(clientId: string): Promise<{
    propensity: ChurnPropensityScore;
    triggered: boolean;
    campaign?: { campaignId: string; discountPercent: number; channelsTriggered: string[] };
  }> {
    const propensity = await this.churnPredictor.computePropensity(clientId);
    
    if (propensity.isAtRisk()) {
      const campaign = await this.winBackCampaign.triggerWinBackCampaign(clientId, propensity);
      return { propensity, triggered: true, campaign };
    }

    return { propensity, triggered: false };
  }

  public async executeDailyBatch(): Promise<{
    evaluatedCount: number;
    triggeredCount: number;
  }> {
    const allScores = await this.churnPredictor.computeAllActiveClients();
    let triggeredCount = 0;

    for (const score of allScores) {
      if (score.isAtRisk()) {
        await this.winBackCampaign.triggerWinBackCampaign(score.clientId, score);
        triggeredCount++;
      }
    }

    return { evaluatedCount: allScores.length, triggeredCount };
  }
}
