export interface SentimentAlertRule {
  id: string;
  name: string;
  triggerCondition:
    'rating_lte_2' | 'negative_sentiment' | 'unreplied_duration_gt_24h' | 'competitor_rating_surge';
  enabled: boolean;
  notificationChannel: 'Push' | 'Email' | 'Webhook';
}

export interface SentimentAlertEvaluationResult {
  triggeredAlerts: {
    ruleId: string;
    ruleName: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  totalTriggered: number;
}
