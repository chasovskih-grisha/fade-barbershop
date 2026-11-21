import type {
  ReviewRequestTimingOptimizationRequest,
  ReviewRequestTimingOptimizationResult,
} from './types';

interface TimingPlan {
  optimalDelayMinutes: number;
  predictedConversionRatePct: number;
  predictedPositiveSentimentLikelihoodPct: number;
  rationale: string;
}

function resolveTiming(request: ReviewRequestTimingOptimizationRequest): TimingPlan {
  const defaultPlan: TimingPlan = {
    optimalDelayMinutes: 30,
    predictedConversionRatePct: 42,
    predictedPositiveSentimentLikelihoodPct: 85,
    rationale:
      'Standard 30-minute post-service delay allows client to experience haircut in transit while memory is fresh.',
  };

  if (request.appointmentCompletionHour >= 21 || request.appointmentCompletionHour < 8) {
    return {
      ...defaultPlan,
      optimalDelayMinutes: 720,
      rationale:
        'Appointment completed outside business hours. Scheduled review request for morning delivery to maximize open rate.',
    };
  }

  if (request.clientPastVisitsCount > 3) {
    return {
      optimalDelayMinutes: 15,
      predictedConversionRatePct: 68,
      predictedPositiveSentimentLikelihoodPct: 94,
      rationale:
        'High loyalty client detected. Immediate review request yields high conversion and 5-star sentiment.',
    };
  }

  return defaultPlan;
}

/**
 * Optimize review request delivery timing and communication channel based on appointment context and client history.
 */
export function optimizeReviewRequestTiming(
  request: ReviewRequestTimingOptimizationRequest
): ReviewRequestTimingOptimizationResult {
  const timing = resolveTiming(request);
  const recommendedChannel: 'SMS' | 'Push' | 'Email' = request.preferredChannel || 'SMS';

  return {
    optimalDelayMinutes: timing.optimalDelayMinutes,
    recommendedChannel,
    predictedConversionRatePct: timing.predictedConversionRatePct,
    predictedPositiveSentimentLikelihoodPct: timing.predictedPositiveSentimentLikelihoodPct,
    rationale: timing.rationale,
  };
}
