'use client';

import React, { useState } from 'react';
import { ReputationEngine, ReviewInput, CompetitorBenchmark } from '@fade/domain-shared';

const engine = new ReputationEngine();

const INITIAL_REVIEWS: ReviewInput[] = [
  {
    id: 'rev-1',
    clientName: 'Alexander Wright',
    service: 'Executive Fade & Beard Trim',
    barber: 'Dmytro K.',
    rating: 5,
    comment: 'Absolute masterclass! Dmytro understood exactly what shape I needed. The hot towel finish was top notch.',
    date: '2026-11-10',
    platform: 'Google',
    replied: true,
  },
  {
    id: 'rev-2',
    clientName: 'Max Taylor',
    service: 'Classic Haircut',
    barber: 'Andriy S.',
    rating: 4,
    comment: 'Great haircut and clean shop. Waited about 10 minutes past my booking time though.',
    date: '2026-11-09',
    platform: 'Yelp',
    replied: false,
  },
  {
    id: 'rev-3',
    clientName: 'Viktor Hnativ',
    service: 'Beard Sculpting',
    barber: 'Oleg M.',
    rating: 2,
    comment: 'Trimmed too short on the left side compared to the right. Disappointed with the symmetry.',
    date: '2026-11-08',
    platform: 'App Feedback',
    replied: false,
  },
];

const INITIAL_BENCHMARKS: CompetitorBenchmark[] = [
  { competitorName: "Gentlemen's Club Barbershop", rating: 4.5, reviewCount: 120, responseRatePct: 45, avgReplyHours: 12 },
  { competitorName: 'Sharp & Co.', rating: 4.3, reviewCount: 95, responseRatePct: 30, avgReplyHours: 24 },
];

export default function ReputationDashboard() {
  const [reviews, setReviews] = useState<ReviewInput[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [showVelocityModal, setShowVelocityModal] = useState<boolean>(false);

  // Compute summary via ReputationEngine
  const summary = engine.calculateSummary({
    reviews,
    competitorBenchmarks: INITIAL_BENCHMARKS,
  });

  // Compute competitor velocity analysis
  const velocityAnalysis = engine.analyzeCompetitorVelocity({
    fadeMonthlyReviews: [18, 22, 25],
    fadeAverageRating: summary.averageRating,
    competitors: [
      { competitorName: "Gentlemen's Club", monthlyReviews: [10, 12, 14], averageRating: 4.5, sentimentScore: 85 },
      { competitorName: 'Sharp & Co.', monthlyReviews: [8, 9, 10], averageRating: 4.3, sentimentScore: 78 },
    ],
  });

  // Compute topic sentiment clustering analysis
  const topicAnalysis = engine.analyzeReviewTopics(reviews);

  // Compute competitor action plan & sentiment alerts
  const actionPlan = engine.generateCompetitorActionPlan({
    fadeAverageRating: summary.averageRating,
    marketAverageRating: summary.competitiveComparison.marketAverageRating,
    unrepliedNegativeCount: summary.escalationRequiredCount,
    competitors: INITIAL_BENCHMARKS,
  });

  const sentimentAlerts = engine.evaluateSentimentAlerts(reviews, [
    { id: 'a1', name: 'Critical Low Rating (<= 2)', triggerCondition: 'rating_lte_2', enabled: true, notificationChannel: 'Push' },
    { id: 'a2', name: 'Unreplied Negative Sentiment', triggerCondition: 'negative_sentiment', enabled: true, notificationChannel: 'Email' },
  ]);

  const pricingMatrix = engine.analyzeCompetitorPricingMatrix({
    fadeAverageHaircutPrice: 38,
    fadeAverageRating: 4.96,
    competitors: [
      { competitorName: "Gentlemen's Club", averageHaircutPrice: 42, rating: 4.5, positioning: 'luxury' },
      { competitorName: 'Sharp & Co.', averageHaircutPrice: 35, rating: 4.3, positioning: 'mid-market' },
    ],
  });

  const trendForecast = engine.forecastSentimentTrend({
    monthlyAverageRatings: [4.6, 4.7, 4.8],
    monthlyReviewCounts: [15, 20, 25],
  });

  const filteredReviews = reviews.filter((r) => {
    const sentiment = engine.classifySentiment(r.rating, r.comment);
    if (filter === 'positive') return sentiment === 'positive';
    if (filter === 'negative') return sentiment === 'negative';
    return true;
  });

  const handleAiAutoReply = (rev: ReviewInput) => {
    const sentiment = engine.classifySentiment(rev.rating, rev.comment);
    const autoResult = engine.generateAutoReply({
      reviewId: rev.id,
      clientName: rev.clientName,
      rating: rev.rating,
      sentiment,
      service: rev.service,
      barber: rev.barber,
    });
    setReplyText({ ...replyText, [rev.id]: autoResult.suggestedReply });
  };

  const handleSendReply = (id: string) => {
    if (!replyText[id]) return;
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, replied: true } : r))
    );
    setActiveReplyId(null);
    setReplyText({ ...replyText, [id]: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-fg">
            Reputation & Competitive Intelligence
          </h1>
          <p className="text-sm text-fg-muted">
            Monitor review sentiment, benchmark local competitors, and engage clients in real-time via FADE Reputation Engine.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-white border border-line rounded-lg px-4 py-2 text-center shadow-sm">
            <div className="text-xs text-fg-muted font-medium uppercase">Avg Rating</div>
            <div className="text-h4 font-bold text-fg">⭐ {summary.averageRating} / 5.0</div>
          </div>
          <div className="bg-white border border-line rounded-lg px-4 py-2 text-center shadow-sm">
            <div className="text-xs text-fg-muted font-medium uppercase">Sentiment</div>
            <div className="text-h4 font-bold text-semantic-success">{summary.sentimentBreakdown.positivePercentage}% Positive</div>
          </div>
          <button
            onClick={() => setShowVelocityModal(!showVelocityModal)}
            className="px-4 py-2 bg-accent-blue text-white font-medium rounded-lg text-sm shadow hover:bg-accent-blue transition"
          >
            📊 Competitor Velocity
          </button>
        </div>
      </div>

      {/* Competitor Velocity Deep-Dive Modal / Panel */}
      {showVelocityModal && (
        <div className="bg-accent-blue/10 border border-accent-blue rounded-card p-6 shadow-inner space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-h4 font-bold text-fg">🚀 Competitor Review Velocity & Market Share Analysis</h2>
            <button
              onClick={() => setShowVelocityModal(false)}
              className="text-xs text-accent-blue hover:text-fg font-semibold"
            >
              ✕ Close Panel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm">
              <div className="text-xs text-fg-muted">Growth Velocity (FADE)</div>
              <div className="text-xl font-bold text-accent-blue mt-1">{velocityAnalysis.fadeReviewGrowthVelocity} rev/mo</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm">
              <div className="text-xs text-fg-muted">Share of Voice</div>
              <div className="text-xl font-bold text-semantic-success mt-1">{velocityAnalysis.fadeMarketShareOfVoice}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm">
              <div className="text-xs text-fg-muted">Competitive Rank</div>
              <div className="text-xl font-bold text-fg mt-1">#{velocityAnalysis.competitiveRank} in Kyiv</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm">
              <div className="text-xs text-fg-muted">Threat Level</div>
              <div className={`text-xl font-bold mt-1 uppercase ${velocityAnalysis.threatLevel === 'low' ? 'text-semantic-success' : 'text-semantic-warning'}`}>
                {velocityAnalysis.threatLevel}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm space-y-2">
            <div className="text-xs font-semibold text-fg uppercase">AI Strategic Recommendations:</div>
            <ul className="list-disc list-inside text-sm text-fg-secondary space-y-1">
              {velocityAnalysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Competitor Benchmark Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-card p-6 shadow-md">
        <h2 className="text-h4 font-semibold mb-3">📍 Local Competitive Benchmark (Kyiv District)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
            <div className="text-sm text-accent-blue">FADE Platform (Us)</div>
            <div className="text-2xl font-bold mt-1">{summary.averageRating} ⭐ <span className="text-xs font-normal text-semantic-success">+{summary.competitiveComparison.ratingDeltaVsMarket} vs market</span></div>
            <div className="text-xs text-fg-muted mt-2">Response rate: {summary.responseMetrics.responseRatePct}% • Escalations: {summary.escalationRequiredCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/5">
            <div className="text-sm text-fg-secondary">Gentlemen's Club Barbershop</div>
            <div className="text-2xl font-bold mt-1">4.5 ⭐</div>
            <div className="text-xs text-fg-muted mt-2">Response rate: 45% • Avg reply time: 12.0h</div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/5">
            <div className="text-sm text-fg-secondary">Sharp & Co.</div>
            <div className="text-2xl font-bold mt-1">4.3 ⭐</div>
            <div className="text-xs text-fg-muted mt-2">Response rate: 30% • Avg reply time: 24.0h</div>
          </div>
        </div>
      </div>

      {/* Competitor Pricing Matrix & Sentiment Trend Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-3">
          <h3 className="text-body font-bold text-fg">🏷️ Competitor Pricing & Positioning Matrix</h3>
          <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
            <span>Market Avg Price:</span>
            <span className="font-bold text-fg">${pricingMatrix.marketAveragePrice}</span>
          </div>
          <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
            <span>Positioning Category:</span>
            <span className="font-bold text-accent-blue">{pricingMatrix.positioningCategory}</span>
          </div>
          <div className="text-xs text-fg-muted bg-accent-blue/10 p-3 rounded-lg border border-accent-blue">
            <span className="font-semibold">AI Recommendation:</span> {pricingMatrix.recommendation}
          </div>
        </div>

        <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-3">
          <h3 className="text-body font-bold text-fg">📈 Review Sentiment Trend & Loyalty Forecast</h3>
          <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
            <span>Projected Next Month Rating:</span>
            <span className="font-bold text-semantic-success">{trendForecast.projectedNextMonthRating} ⭐</span>
          </div>
          <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
            <span>Brand Loyalty Score:</span>
            <span className="font-bold text-accent-blue">{trendForecast.brandLoyaltyScore} / 100</span>
          </div>
          <div className="text-xs text-fg-muted bg-semantic-success/10 p-3 rounded-lg border border-semantic-success">
            <span className="font-semibold">Trajectory Insights:</span> {trendForecast.forecastingInsights[0]}
          </div>
        </div>
      </div>

      {/* Sentiment Topic Clustering & Keyword Driver Breakdown */}
      <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-h4 font-bold text-fg">🧠 Sentiment Topic Clustering & Actionable Drivers</h2>
            <p className="text-xs text-fg-muted">
              AI-driven breakdown of feedback topics. Top Strength: <span className="font-semibold text-semantic-success">{topicAnalysis.topStrength}</span> • Focus Area: <span className="font-semibold text-semantic-danger">{topicAnalysis.primaryImprovementArea}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topicAnalysis.topics.map((t) => (
            <div key={t.topic} className="bg-surface-sunken border border-line rounded-lg p-4 space-y-2">
              <div className="text-xs font-bold text-fg uppercase tracking-wider">{t.topic}</div>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-bold text-fg">{t.averageRating} ⭐</span>
                <span className="text-xs font-semibold text-fg-muted">{t.mentionCount} mentions</span>
              </div>
              <div className="w-full bg-interactive h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${t.sentimentScore >= 80 ? 'bg-emerald-500' : t.sentimentScore >= 60 ? 'bg-semantic-warning' : 'bg-rose-500'}`}
                  style={{ width: `${t.sentimentScore}%` }}
                />
              </div>
              <div className="text-[11px] text-fg-muted">
                Drivers: {t.keyDrivers.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Competitor Action Plan & Automated Sentiment Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h4 font-bold text-fg">🎯 Strategic Competitor Action Plan</h2>
              <p className="text-xs text-fg-muted">Autonomous recommendations to defend rating leadership and capture local market share.</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${actionPlan.strategicPriority === 'High' ? 'bg-rose-100 text-semantic-danger' : 'bg-emerald-100 text-emerald-700'}`}>
              Priority: {actionPlan.strategicPriority}
            </span>
          </div>
          <div className="bg-surface-sunken p-3 rounded-lg border border-line text-xs text-fg font-medium">
            💡 {actionPlan.summaryRecommendation}
          </div>
          <div className="space-y-3">
            {actionPlan.actionItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-line rounded-lg shadow-sm">
                <span className="text-sm">📌</span>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-fg">{item.title}</span>
                    <span className="text-[10px] bg-surface-raised text-fg-secondary px-2 py-0.5 rounded font-semibold">{item.category}</span>
                  </div>
                  <p className="text-xs text-fg-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-h4 font-bold text-fg">⚡ Sentiment Alert Rules</h2>
            <span className="text-xs font-bold bg-semantic-warning/15 text-semantic-warning px-2 py-0.5 rounded">
              {sentimentAlerts.totalTriggered} Triggered
            </span>
          </div>
          <p className="text-xs text-fg-muted">Active automated triggers monitoring real-time review sentiment & escalations.</p>
          <div className="space-y-3">
            {sentimentAlerts.triggeredAlerts.map((alert) => (
              <div key={alert.ruleId} className="p-3 bg-semantic-danger/10 border border-semantic-danger rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-semantic-danger">{alert.ruleName}</span>
                  <span className="text-[10px] uppercase font-bold bg-semantic-danger/15 text-semantic-danger px-1.5 py-0.5 rounded">Critical</span>
                </div>
                <p className="text-xs text-semantic-danger">{alert.message}</p>
              </div>
            ))}
            {sentimentAlerts.totalTriggered === 0 && (
              <div className="p-4 bg-semantic-success/10 border border-semantic-success rounded-lg text-xs text-semantic-success font-medium text-center">
                ✓ All sentiment rules normal. No escalation alerts triggered.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-card border border-line shadow-sm overflow-hidden">
        <div className="p-4 border-b border-line flex justify-between items-center bg-surface-sunken">
          <h3 className="font-semibold text-fg">Customer Feedback & Sentiment Stream ({summary.totalReviews})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-surface-base text-white'
                  : 'bg-white text-fg-secondary border border-line hover:bg-interactive-hover'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setFilter('positive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'positive'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-fg-secondary border border-line hover:bg-interactive-hover'
              }`}
            >
              Positive
            </button>
            <button
              onClick={() => setFilter('negative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'negative'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-fg-secondary border border-line hover:bg-interactive-hover'
              }`}
            >
              Needs Attention ({summary.escalationRequiredCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-line">
          {filteredReviews.map((rev) => {
            const sentiment = engine.classifySentiment(rev.rating, rev.comment);
            return (
              <div key={rev.id} className="p-5 hover:bg-surface-sunken transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-fg">{rev.clientName}</span>
                      <span className="text-xs bg-surface-raised text-fg-secondary px-2 py-0.5 rounded font-medium">
                        {rev.platform}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          sentiment === 'positive'
                            ? 'bg-semantic-success/10 text-emerald-700'
                            : sentiment === 'negative'
                            ? 'bg-semantic-danger/10 text-semantic-danger'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {sentiment}
                      </span>
                    </div>
                    <div className="text-xs text-fg-muted mt-0.5">
                      Service: {rev.service} • Barber: {rev.barber} • {rev.date}
                    </div>
                  </div>
                  <div className="text-semantic-warning font-bold">
                    {'⭐'.repeat(rev.rating)}
                  </div>
                </div>

                <p className="mt-3 text-fg text-sm bg-surface-sunken p-3 rounded-lg border border-line">
                  "{rev.comment}"
                </p>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-xs text-fg-muted">
                    {rev.replied ? (
                      <span className="text-semantic-success font-medium">✓ Replied & Resolved</span>
                    ) : (
                      <span className="text-semantic-warning font-medium">⚠ Pending management response</span>
                    )}
                  </div>
                  {!rev.replied && activeReplyId !== rev.id && (
                    <button
                      onClick={() => setActiveReplyId(rev.id)}
                      className="px-3 py-1 text-xs font-medium bg-surface-base text-white rounded hover:bg-interactive-hover transition"
                    >
                      Reply & Resolve
                    </button>
                  )}
                </div>

                {activeReplyId === rev.id && (
                  <div className="mt-3 space-y-2 bg-surface-raised p-3 rounded-lg border border-line">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-fg">Response Composer</span>
                      <button
                        onClick={() => handleAiAutoReply(rev)}
                        className="px-2 py-1 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue flex items-center gap-1 shadow-sm"
                      >
                        ✨ AI Auto-Reply Assistant
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className="w-full text-xs p-2 rounded border border-line focus:outline-none focus:ring-2 focus:ring-fg"
                      placeholder="Write a professional response or click AI Auto-Reply Assistant..."
                      value={replyText[rev.id] || ''}
                      onChange={(e) =>
                        setReplyText({ ...replyText, [rev.id]: e.target.value })
                      }
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="px-2.5 py-1 text-xs font-medium text-fg-secondary hover:bg-interactive-hover rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        className="px-3 py-1 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue"
                      >
                        Send Response
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
