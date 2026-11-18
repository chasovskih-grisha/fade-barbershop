import {
  ReviewInput,
  ReputationSummaryRequest,
  ReputationSummaryResult,
  AutoReplyRequest,
  AutoReplyResult,
  SentimentType,
  CompetitorVelocityAnalysisRequest,
  CompetitorVelocityAnalysisResult,
  ReviewTopicCategory,
  TopicSentimentSummary,
  TopicSentimentAnalysisResult,
  CompetitorActionPlanRequest,
  CompetitorActionPlanResult,
  SentimentAlertRule,
  SentimentAlertEvaluationResult,
  CompetitorPricingMatrixRequest,
  CompetitorPricingMatrixResult,
  ReviewSentimentTrendForecastRequest,
  ReviewSentimentTrendForecastResult,
  PlatformAttributionSummary,
  PlatformAttributionAnalysisResult,
  ReviewRequestTimingOptimizationRequest,
  ReviewRequestTimingOptimizationResult,
  ClientChurnRiskPredictionRequest,
  ClientChurnRiskPredictionResult,
} from './types';

export class ReputationEngine {
  /**
   * Calculate aggregated reputation metrics, sentiment breakdown, and competitive comparisons.
   */
  public calculateSummary(request: ReputationSummaryRequest): ReputationSummaryResult {
    const reviews = request.reviews || [];
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0.0,
        sentimentBreakdown: { positiveCount: 0, neutralCount: 0, negativeCount: 0, positivePercentage: 0 },
        responseMetrics: { repliedCount: 0, pendingCount: 0, responseRatePct: 0 },
        escalationRequiredCount: 0,
        competitiveComparison: { fadeRating: 0.0, marketAverageRating: 0.0, ratingDeltaVsMarket: 0.0 },
      };
    }

    const totalRatingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(1));

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let repliedCount = 0;
    let escalationRequiredCount = 0;

    for (const r of reviews) {
      // Classify sentiment if rating dictates it
      const sentiment = this.classifySentiment(r.rating, r.comment);
      if (sentiment === 'positive') positiveCount++;
      else if (sentiment === 'negative') {
        negativeCount++;
        if (!r.replied) {
          escalationRequiredCount++;
        }
      } else {
        neutralCount++;
      }

      if (r.replied) {
        repliedCount++;
      }
    }

    const positivePercentage = Math.round((positiveCount / totalReviews) * 100);
    const pendingCount = totalReviews - repliedCount;
    const responseRatePct = Math.round((repliedCount / totalReviews) * 100);

    const benchmarks = request.competitorBenchmarks || [];
    const marketAvg = benchmarks.length > 0
      ? benchmarks.reduce((acc, b) => acc + b.rating, 0) / benchmarks.length
      : averageRating;

    const marketAverageRating = parseFloat(marketAvg.toFixed(1));
    const ratingDeltaVsMarket = parseFloat((averageRating - marketAverageRating).toFixed(1));

    return {
      totalReviews,
      averageRating,
      sentimentBreakdown: {
        positiveCount,
        neutralCount,
        negativeCount,
        positivePercentage,
      },
      responseMetrics: {
        repliedCount,
        pendingCount,
        responseRatePct,
      },
      escalationRequiredCount,
      competitiveComparison: {
        fadeRating: averageRating,
        marketAverageRating,
        ratingDeltaVsMarket,
      },
    };
  }

  /**
   * Classify review sentiment based on rating and keyword analysis.
   */
  public classifySentiment(rating: number, comment: string): SentimentType {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';

    const lower = (comment || '').toLowerCase();
    const negativeKeywords = ['bad', 'poor', 'disappointed', 'terrible', 'worst', 'horrible', 'wrong', 'short', 'wait', 'late'];
    const positiveKeywords = ['great', 'excellent', 'amazing', 'masterclass', 'perfect', 'clean', 'top', 'love', 'best'];

    const hasNeg = negativeKeywords.some((kw) => lower.includes(kw));
    const hasPos = positiveKeywords.some((kw) => lower.includes(kw));

    if (hasNeg && !hasPos) return 'negative';
    if (hasPos && !hasNeg) return 'positive';

    return 'neutral';
  }

  /**
   * Generate an automated professional reply and escalation priority based on review characteristics.
   */
  public generateAutoReply(request: AutoReplyRequest): AutoReplyResult {
    const { reviewId, clientName, rating, sentiment, service, barber } = request;
    const firstName = clientName.split(' ')[0] || clientName;

    let suggestedReply = '';
    let requiresEscalationToAdmin = false;
    let priority: 'low' | 'medium' | 'urgent' = 'low';

    if (sentiment === 'positive' || rating >= 4) {
      priority = 'low';
      suggestedReply = `Hi ${firstName}, thank you for the wonderful 5-star review! We're thrilled you enjoyed your ${service} with ${barber}. See you again soon at FADE!`;
    } else if (sentiment === 'negative' || rating <= 2) {
      priority = 'urgent';
      requiresEscalationToAdmin = true;
      suggestedReply = `Dear ${firstName}, we sincerely apologize that your experience with ${barber} didn't meet your expectations. Management has been notified and we would like to invite you back for a complimentary correction. Please contact us directly.`;
    } else {
      priority = 'medium';
      suggestedReply = `Hi ${firstName}, thank you for your feedback regarding your ${service}. We appreciate your notes and are continuously improving our service quality at FADE.`;
    }

    return {
      reviewId,
      suggestedReply,
      requiresEscalationToAdmin,
      priority,
    };
  }

  /**
   * Analyze competitor review velocity, market share of voice, and competitive ranking.
   */
  public analyzeCompetitorVelocity(request: CompetitorVelocityAnalysisRequest): CompetitorVelocityAnalysisResult {
    const fadeReviews = request.fadeMonthlyReviews || [];
    const avgFadeMonthly = fadeReviews.length > 0 ? fadeReviews.reduce((a, b) => a + b, 0) / fadeReviews.length : 0;

    let totalMarketMonthly = avgFadeMonthly;
    const competitorSummaries = (request.competitors || []).map((comp) => {
      const avgCompMonthly = comp.monthlyReviews.length > 0 ? comp.monthlyReviews.reduce((a, b) => a + b, 0) / comp.monthlyReviews.length : 0;
      totalMarketMonthly += avgCompMonthly;
      return {
        name: comp.competitorName,
        avgMonthly: avgCompMonthly,
        rating: comp.averageRating,
      };
    });

    const fadeMarketShareOfVoice = totalMarketMonthly > 0 ? Number(((avgFadeMonthly / totalMarketMonthly) * 100).toFixed(1)) : 100;

    const allEntrants = [
      { name: 'FADE Platform', rating: request.fadeAverageRating, volume: avgFadeMonthly },
      ...competitorSummaries.map((c) => ({ name: c.name, rating: c.rating, volume: c.avgMonthly })),
    ].sort((a, b) => b.rating - a.rating || b.volume - a.volume);

    const fadeIndex = allEntrants.findIndex((e) => e.name === 'FADE Platform');
    const fadeRank = fadeIndex >= 0 ? fadeIndex + 1 : 1;
    const marketLeader = allEntrants[0]?.name || 'FADE Platform';

    let threatLevel: 'low' | 'moderate' | 'high' = 'low';
    if (fadeRank > 2) threatLevel = 'high';
    else if (fadeRank === 2) threatLevel = 'moderate';

    const recommendations: string[] = [];
    if (fadeRank === 1) {
      recommendations.push('Maintain review acquisition pace to protect market leadership position.');
    } else {
      recommendations.push(`Competitor "${marketLeader}" leads in rating/volume. Increase post-visit review requests to capture market share.`);
    }

    if (avgFadeMonthly < 10) {
      recommendations.push('Monthly review volume is low. Enable automated post-visit SMS triggers to boost review velocity.');
    }

    return {
      fadeReviewGrowthVelocity: Number(avgFadeMonthly.toFixed(1)),
      fadeMarketShareOfVoice,
      marketLeader,
      threatLevel,
      competitiveRank: fadeRank,
      recommendations,
    };
  }

  /**
   * Analyze review sentiment clustered by topic categories (Haircut Precision, Punctuality, Cleanliness, etc.).
   */
  public analyzeReviewTopics(reviews: ReviewInput[]): TopicSentimentAnalysisResult {
    const topics: ReviewTopicCategory[] = [
      'Haircut Precision',
      'Punctuality & Wait Time',
      'Shop Vibe & Cleanliness',
      'Staff Courtesy',
      'Beard & Grooming',
    ];

    const topicMap: Record<ReviewTopicCategory, { ratings: number[]; sentiments: SentimentType[]; keywords: Set<string> }> = {
      'Haircut Precision': { ratings: [], sentiments: [], keywords: new Set(['fade', 'cut', 'shape', 'symmetry', 'precision', 'masterclass']) },
      'Punctuality & Wait Time': { ratings: [], sentiments: [], keywords: new Set(['wait', 'late', 'time', 'delay', 'punctual', 'schedule']) },
      'Shop Vibe & Cleanliness': { ratings: [], sentiments: [], keywords: new Set(['clean', 'vibe', 'shop', 'atmosphere', 'towel', 'coffee']) },
      'Staff Courtesy': { ratings: [], sentiments: [], keywords: new Set(['staff', 'friendly', 'rude', 'courtesy', 'welcome', 'service']) },
      'Beard & Grooming': { ratings: [], sentiments: [], keywords: new Set(['beard', 'trim', 'sculpting', 'mustache', 'shave']) },
    };

    const summaries: TopicSentimentSummary[] = topics.map((topic) => {
      const config = topicMap[topic];
      // Fallback matching if comment mentions keywords or service name matches
      const matchingReviews = reviews.filter((r) => {
        const text = `${r.comment} ${r.service}`.toLowerCase();
        return Array.from(config.keywords).some((kw) => text.includes(kw));
      });

      const count = matchingReviews.length;
      if (count === 0) {
        return {
          topic,
          mentionCount: 0,
          averageRating: 5.0,
          sentimentScore: 100,
          dominantSentiment: 'positive',
          keyDrivers: ['No recent mentions'],
        };
      }

      const totalRating = matchingReviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = Number((totalRating / count).toFixed(1));
      const sentimentScore = Math.round((avgRating / 5) * 100);
      const dominantSentiment: SentimentType = avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral';

      return {
        topic,
        mentionCount: count,
        averageRating: avgRating,
        sentimentScore,
        dominantSentiment,
        keyDrivers: Array.from(config.keywords).slice(0, 3),
      };
    });

    const sortedBySentiment = [...summaries].sort((a, b) => b.sentimentScore - a.sentimentScore);
    const topStrength = sortedBySentiment[0]?.topic || 'Haircut Precision';
    const primaryImprovementArea = sortedBySentiment[sortedBySentiment.length - 1]?.topic || 'Punctuality & Wait Time';

    return {
      topics: summaries,
      topStrength,
      primaryImprovementArea,
    };
  }

  /**
   * Generate an actionable strategic plan to improve market reputation and beat local competitors.
   */
  public generateCompetitorActionPlan(request: CompetitorActionPlanRequest): CompetitorActionPlanResult {
    const delta = request.fadeAverageRating - request.marketAverageRating;
    const actionItems: CompetitorActionPlanResult['actionItems'] = [];

    if (delta < 0) {
      actionItems.push({
        category: 'Quality & Operations',
        title: 'Close Rating Gap with Market Leader',
        description: `FADE rating (${request.fadeAverageRating}) is trailing market average (${request.marketAverageRating}). Conduct staff quality audits on bottom-performing barber stations.`,
        impact: 'High',
      });
    } else {
      actionItems.push({
        category: 'Competitive Positioning',
        title: 'Capitalize on Market Leadership',
        description: `FADE rating leads the local market. Highlight Google & Yelp star ratings in promotional banners and social ads.`,
        impact: 'High',
      });
    }

    if (request.unrepliedNegativeCount > 0) {
      actionItems.push({
        category: 'Response Speed',
        title: 'Resolve Pending Negative Reviews',
        description: `There are ${request.unrepliedNegativeCount} unreplied negative or low-rating reviews. Immediate manager response within 2 hours prevents churn.`,
        impact: 'High',
      });
    }

    actionItems.push({
      category: 'Review Acquisition',
      title: 'Automated Post-Visit SMS Review Trigger',
      description: 'Ensure automated SMS review requests are sent 30 minutes after appointment completion to boost review velocity and dilute older negative feedback.',
      impact: 'Medium',
    });

    const strategicPriority = request.unrepliedNegativeCount > 0 || delta < -0.2 ? 'High' : delta < 0 ? 'Medium' : 'Low';

    return {
      strategicPriority,
      actionItems,
      summaryRecommendation: strategicPriority === 'High'
        ? 'Urgent operational intervention required to address pending negative reviews and close rating deficit.'
        : 'Reputation is healthy. Focus on automated review acquisition and maintaining stellar service standards.',
    };
  }

  /**
   * Evaluate active sentiment alert rules against recent reviews and competitor benchmarks.
   */
  public evaluateSentimentAlerts(reviews: ReviewInput[], rules: SentimentAlertRule[]): SentimentAlertEvaluationResult {
    const triggeredAlerts: SentimentAlertEvaluationResult['triggeredAlerts'] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      if (rule.triggerCondition === 'rating_lte_2') {
        const matching = reviews.filter((r) => r.rating <= 2 && !r.replied);
        if (matching.length > 0) {
          triggeredAlerts.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: `${matching.length} unreplied review(s) with rating <= 2 detected.`,
            severity: 'critical',
          });
        }
      } else if (rule.triggerCondition === 'negative_sentiment') {
        const matching = reviews.filter((r) => this.classifySentiment(r.rating, r.comment) === 'negative' && !r.replied);
        if (matching.length > 0) {
          triggeredAlerts.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: `${matching.length} unreplied negative sentiment review(s) detected.`,
            severity: 'warning',
          });
        }
      }
    }

    return {
      triggeredAlerts,
      totalTriggered: triggeredAlerts.length,
    };
  }

  /**
   * Analyze competitor pricing and rating matrix to determine market positioning and pricing power.
   */
  public analyzeCompetitorPricingMatrix(request: CompetitorPricingMatrixRequest): CompetitorPricingMatrixResult {
    const competitors = request.competitors || [];
    if (competitors.length === 0) {
      return {
        marketAveragePrice: request.fadeAverageHaircutPrice,
        priceDeltaVsMarket: 0,
        positioningCategory: 'Solo Benchmark (Mid-Market)',
        recommendation: 'Add local competitor pricing benchmarks to evaluate market positioning.',
      };
    }

    const totalMarketPrice = competitors.reduce((acc, c) => acc + c.averageHaircutPrice, request.fadeAverageHaircutPrice);
    const totalEntrants = competitors.length + 1;
    const marketAveragePrice = Number((totalMarketPrice / totalEntrants).toFixed(2));
    const priceDeltaVsMarket = Number((request.fadeAverageHaircutPrice - marketAveragePrice).toFixed(2));

    let positioningCategory = 'Competitive Mid-Market';
    if (request.fadeAverageHaircutPrice > marketAveragePrice * 1.15 && request.fadeAverageRating >= 4.5) {
      positioningCategory = 'Premium Value Leader (High Price & High Rating)';
    } else if (request.fadeAverageHaircutPrice < marketAveragePrice * 0.85) {
      positioningCategory = 'Value Challenger (Aggressive Pricing)';
    }

    let recommendation = 'Pricing aligns well with local market average while maintaining strong ratings.';
    if (priceDeltaVsMarket > 5 && request.fadeAverageRating < 4.4) {
      recommendation = 'Pricing is above market average while ratings trail competitors. Consider service quality enhancements before further price increases.';
    } else if (priceDeltaVsMarket < -5 && request.fadeAverageRating >= 4.7) {
      recommendation = 'Strong rating leadership with below-market pricing. Opportunity to test premium tier pricing adjustments.';
    }

    return {
      marketAveragePrice,
      priceDeltaVsMarket,
      positioningCategory,
      recommendation,
    };
  }

  /**
   * Forecast sentiment trend and review volume momentum for upcoming months.
   */
  public forecastSentimentTrend(request: ReviewSentimentTrendForecastRequest): ReviewSentimentTrendForecastResult {
    const ratings = request.monthlyAverageRatings || [];
    const counts = request.monthlyReviewCounts || [];

    if (ratings.length === 0) {
      return {
        currentRating: 0,
        projectedNextMonthRating: 0,
        trajectory: 'stable',
        reviewMomentumIndex: 0,
        brandLoyaltyScore: 0,
        forecastingInsights: ['Insufficient historical rating data for trend forecasting.'],
      };
    }

    const currentRating = ratings[ratings.length - 1] ?? 0;
    const previousRating = ratings.length > 1 ? (ratings[ratings.length - 2] ?? currentRating) : currentRating;
    const ratingDelta = currentRating - previousRating;

    let projectedNextMonthRating = Number((currentRating + ratingDelta * 0.5).toFixed(2));
    if (projectedNextMonthRating > 5.0) projectedNextMonthRating = 5.0;
    if (projectedNextMonthRating < 1.0) projectedNextMonthRating = 1.0;

    let trajectory: 'improving' | 'stable' | 'declining' = 'stable';
    if (ratingDelta > 0.05) trajectory = 'improving';
    else if (ratingDelta < -0.05) trajectory = 'declining';

    let reviewMomentumIndex = 0;
    if (counts.length >= 2) {
      const recentCount = counts[counts.length - 1] ?? 0;
      const priorCount = counts[counts.length - 2] ?? 0;
      if (priorCount > 0) {
        reviewMomentumIndex = Math.round(((recentCount - priorCount) / priorCount) * 100);
      }
    }

    const brandLoyaltyScore = Math.min(100, Math.max(0, Math.round((currentRating / 5.0) * 80 + Math.min(20, reviewMomentumIndex))));

    const forecastingInsights: string[] = [];
    if (trajectory === 'improving') {
      forecastingInsights.push('Review ratings show positive upward momentum over recent months.');
    } else if (trajectory === 'declining') {
      forecastingInsights.push('Warning: Rating trajectory is declining. Review recent client feedback for service consistency gaps.');
    } else {
      forecastingInsights.push('Rating trajectory remains stable and resilient.');
    }

    if (reviewMomentumIndex > 15) {
      forecastingInsights.push(`High review acquisition velocity (+${reviewMomentumIndex}% MoM), strengthening local SEO ranking.`);
    }

    return {
      currentRating,
      projectedNextMonthRating,
      trajectory,
      reviewMomentumIndex,
      brandLoyaltyScore,
      forecastingInsights,
    };
  }

  /**
   * Analyze platform source attribution, ratings, sentiment, response rate, and share of reviews.
   */
  public analyzePlatformAttribution(reviews: ReviewInput[]): PlatformAttributionAnalysisResult {
    const totalReviews = reviews.length;
    const platformsList: ('Google' | 'Yelp' | 'App Feedback' | 'Facebook' | 'Instagram')[] = [
      'Google',
      'Yelp',
      'App Feedback',
      'Facebook',
      'Instagram',
    ];

    const summaries: PlatformAttributionSummary[] = platformsList.map((pName) => {
      const pReviews = reviews.filter((r) => r.platform === pName);
      const count = pReviews.length;
      if (count === 0) {
        return {
          platform: pName,
          totalReviews: 0,
          averageRating: 0,
          positiveSentimentPct: 0,
          responseRatePct: 0,
          shareOfReviewsPct: 0,
        };
      }

      const ratingSum = pReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = Number((ratingSum / count).toFixed(1));

      const positiveCount = pReviews.filter((r) => this.classifySentiment(r.rating, r.comment) === 'positive').length;
      const positiveSentimentPct = Math.round((positiveCount / count) * 100);

      const repliedCount = pReviews.filter((r) => r.replied).length;
      const responseRatePct = Math.round((repliedCount / count) * 100);

      const shareOfReviewsPct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

      return {
        platform: pName,
        totalReviews: count,
        averageRating,
        positiveSentimentPct,
        responseRatePct,
        shareOfReviewsPct,
      };
    });

    const activePlatforms = summaries.filter((s) => s.totalReviews > 0).sort((a, b) => b.averageRating - a.averageRating);
    const topPerformingPlatform = activePlatforms[0]?.platform || 'Google';

    const activeCount = activePlatforms.length;
    const sourceDiversificationScore = Math.min(100, activeCount * 25 + (totalReviews >= 10 ? 25 : 0));

    const recommendations: string[] = [];
    if (activeCount < 3) {
      recommendations.push('Review acquisition is concentrated on few platforms. Diversify review requests to Yelp and Facebook to improve local search coverage.');
    } else {
      recommendations.push('Healthy multi-platform review distribution supporting robust local SEO.');
    }

    const unrepliedPerPlatform = summaries.find((s) => s.responseRatePct < 50 && s.totalReviews > 0);
    if (unrepliedPerPlatform) {
      recommendations.push(`Platform "${unrepliedPerPlatform.platform}" has a low response rate (${unrepliedPerPlatform.responseRatePct}%). Increase management response velocity.`);
    }

    return {
      platforms: summaries,
      topPerformingPlatform,
      sourceDiversificationScore,
      recommendations,
    };
  }

  /**
   * Optimize review request delivery timing and communication channel based on appointment context and client history.
   */
  public optimizeReviewRequestTiming(request: ReviewRequestTimingOptimizationRequest): ReviewRequestTimingOptimizationResult {
    const { appointmentCompletionHour, clientPastVisitsCount, preferredChannel } = request;

    let optimalDelayMinutes = 30;
    let recommendedChannel: 'SMS' | 'Push' | 'Email' = preferredChannel || 'SMS';
    let predictedConversionRatePct = 42;
    let predictedPositiveSentimentLikelihoodPct = 85;
    let rationale = 'Standard 30-minute post-service delay allows client to experience haircut in transit while memory is fresh.';

    if (appointmentCompletionHour >= 21 || appointmentCompletionHour < 8) {
      optimalDelayMinutes = 720;
      rationale = 'Appointment completed outside business hours. Scheduled review request for morning delivery to maximize open rate.';
    } else if (clientPastVisitsCount > 3) {
      optimalDelayMinutes = 15;
      predictedConversionRatePct = 68;
      predictedPositiveSentimentLikelihoodPct = 94;
      rationale = 'High loyalty client detected. Immediate review request yields high conversion and 5-star sentiment.';
    }

    return {
      optimalDelayMinutes,
      recommendedChannel,
      predictedConversionRatePct,
      predictedPositiveSentimentLikelihoodPct,
      rationale,
    };
  }

  /**
   * Predict client churn risk based on recent rating, sentiment, days since last visit, and historical value.
   */
  public predictClientChurnRisk(request: ClientChurnRiskPredictionRequest): ClientChurnRiskPredictionResult {
    const { clientId, clientName, recentRating, recentComment, daysSinceLastVisit, totalVisitsCount, averageSpend } = request;

    let score = 20;
    if (recentRating <= 2) score += 50;
    else if (recentRating === 3) score += 25;

    if (daysSinceLastVisit > 45) score += 25;
    else if (daysSinceLastVisit > 30) score += 15;

    if (totalVisitsCount <= 1) score += 10;
    else if (totalVisitsCount > 5) score -= 15;

    const churnRiskScore = Math.min(100, Math.max(0, score));

    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    if (churnRiskScore >= 75) riskLevel = 'Critical';
    else if (churnRiskScore >= 50) riskLevel = 'High';
    else if (churnRiskScore >= 30) riskLevel = 'Moderate';

    let recommendedRetentionAction = 'Send standard newsletter and booking reminder.';
    let voucherSuggested = false;
    let voucherAmount = 0;

    if (riskLevel === 'Critical' || riskLevel === 'High') {
      voucherSuggested = true;
      voucherAmount = averageSpend > 0 ? Math.round(averageSpend * 0.5) : 300;
      recommendedRetentionAction = `Urgent manager outreach required with a complimentary service voucher (UAH ${voucherAmount}) and personal barber re-assignment.`;
    } else if (riskLevel === 'Moderate') {
      voucherSuggested = true;
      voucherAmount = 150;
      recommendedRetentionAction = 'Automated win-back SMS with 15% discount on next haircut service.';
    }

    return {
      clientId,
      clientName,
      churnRiskScore,
      riskLevel,
      recommendedRetentionAction,
      voucherSuggested,
      voucherAmount,
    };
  }
}
