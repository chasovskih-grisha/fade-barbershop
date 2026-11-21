import { ReputationEngine } from '../engine';
import { mockReviews } from '../test-fixtures';

describe('ReputationEngine sentiment alerts and topics', () => {
  const engine = new ReputationEngine();

  it('evaluates sentiment alerts correctly', () => {
    const alerts = engine.evaluateSentimentAlerts(mockReviews, [
      {
        id: 'rule-1',
        name: 'Low Rating Alert',
        triggerCondition: 'rating_lte_2',
        enabled: true,
        notificationChannel: 'Push',
      },
      {
        id: 'rule-2',
        name: 'Disabled Alert',
        triggerCondition: 'negative_sentiment',
        enabled: false,
        notificationChannel: 'Email',
      },
    ]);

    expect(alerts.totalTriggered).toBe(1);
    expect(alerts.triggeredAlerts[0]?.ruleId).toBe('rule-1');
  });

  it('clusters review sentiment by topic categories correctly', () => {
    const topicAnalysis = engine.analyzeReviewTopics(mockReviews);
    expect(topicAnalysis.topics.length).toBe(5);
    expect(topicAnalysis.topStrength).toBeDefined();
    expect(topicAnalysis.primaryImprovementArea).toBeDefined();
  });
});
