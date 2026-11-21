import type { ReviewInput, SentimentAlertEvaluationResult, SentimentAlertRule } from './types';
import { classifySentiment } from './sentiment';

type TriggeredAlert = SentimentAlertEvaluationResult['triggeredAlerts'][number];

function evaluateRule(
  rule: SentimentAlertRule,
  reviews: ReviewInput[]
): TriggeredAlert | undefined {
  if (rule.triggerCondition === 'rating_lte_2') {
    const matching = reviews.filter((review) => review.rating <= 2 && !review.replied);
    if (matching.length > 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        message: `${matching.length} unreplied review(s) with rating <= 2 detected.`,
        severity: 'critical',
      };
    }
  }

  if (rule.triggerCondition === 'negative_sentiment') {
    const matching = reviews.filter(
      (review) => classifySentiment(review.rating, review.comment) === 'negative' && !review.replied
    );
    if (matching.length > 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        message: `${matching.length} unreplied negative sentiment review(s) detected.`,
        severity: 'warning',
      };
    }
  }

  return undefined;
}

/**
 * Evaluate active sentiment alert rules against recent reviews and competitor benchmarks.
 */
export function evaluateSentimentAlerts(
  reviews: ReviewInput[],
  rules: SentimentAlertRule[]
): SentimentAlertEvaluationResult {
  const triggeredAlerts: TriggeredAlert[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const alert = evaluateRule(rule, reviews);
    if (alert) triggeredAlerts.push(alert);
  }

  return { triggeredAlerts, totalTriggered: triggeredAlerts.length };
}
