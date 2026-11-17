import { ChurnPropensityScore } from '../domain/churn-propensity.entity';
import { EvaluateChurnAndTriggerWinBackUseCase } from './evaluate-churn.use-case';
import { ChurnPredictorPort, WinBackCampaignPort } from '../domain/churn.ports';

class MockChurnPredictor implements ChurnPredictorPort {
  constructor(private readonly scoreMap: Map<string, number>) {}

  async computePropensity(clientId: string): Promise<ChurnPropensityScore> {
    const score = this.scoreMap.get(clientId) ?? 0.2;
    const cohort =
      score >= 0.75 ? 'CHURNING' : score >= 0.5 ? 'HIGH' : score >= 0.3 ? 'MEDIUM' : 'LOW';
    return new ChurnPropensityScore({
      clientId,
      score,
      riskCohort: cohort,
      lastVisitDaysAgo: Math.round(score * 60 + 10),
      expectedIntervalDays: 30,
      calculatedAt: new Date(),
    });
  }

  async computeAllActiveClients(): Promise<ChurnPropensityScore[]> {
    const results: ChurnPropensityScore[] = [];
    for (const clientId of this.scoreMap.keys()) {
      results.push(await this.computePropensity(clientId));
    }
    return results;
  }
}

class MockWinBackCampaign implements WinBackCampaignPort {
  public triggeredCalls: Array<{ clientId: string; score: ChurnPropensityScore }> = [];

  async triggerWinBackCampaign(clientId: string, score: ChurnPropensityScore) {
    this.triggeredCalls.push({ clientId, score });
    return {
      campaignId: `camp_${clientId}_${Date.now()}`,
      discountPercent: 20,
      channelsTriggered: ['SMS', 'PUSH', 'EMAIL'],
    };
  }
}

describe('EvaluateChurnAndTriggerWinBackUseCase', () => {
  it('triggers win-back campaign when propensity score exceeds 0.75', async () => {
    const scoreMap = new Map<string, number>([
      ['client_at_risk', 0.85],
      ['client_safe', 0.3],
    ]);

    const predictor = new MockChurnPredictor(scoreMap);
    const campaign = new MockWinBackCampaign();
    const useCase = new EvaluateChurnAndTriggerWinBackUseCase(predictor, campaign);

    const resultRisk = await useCase.executeForClient('client_at_risk');
    expect(resultRisk.triggered).toBe(true);
    expect(resultRisk.propensity.isAtRisk()).toBe(true);
    expect(campaign.triggeredCalls).toHaveLength(1);
    expect(campaign.triggeredCalls[0]?.clientId).toBe('client_at_risk');

    const resultSafe = await useCase.executeForClient('client_safe');
    expect(resultSafe.triggered).toBe(false);
    expect(resultSafe.propensity.isAtRisk()).toBe(false);
  });

  it('evaluates daily batch and triggers all high risk clients', async () => {
    const scoreMap = new Map<string, number>([
      ['c1', 0.8],
      ['c2', 0.9],
      ['c3', 0.1],
    ]);

    const predictor = new MockChurnPredictor(scoreMap);
    const campaign = new MockWinBackCampaign();
    const useCase = new EvaluateChurnAndTriggerWinBackUseCase(predictor, campaign);

    const batchResult = await useCase.executeDailyBatch();
    expect(batchResult.evaluatedCount).toBe(3);
    expect(batchResult.triggeredCount).toBe(2);
    expect(campaign.triggeredCalls).toHaveLength(2);
  });
});
