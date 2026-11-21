'use client';

import { useState } from 'react';
import type { ReviewInput } from '@fade/domain-shared';
import ActionPlanAlerts from './ActionPlanAlerts';
import BenchmarkBanner from './BenchmarkBanner';
import PricingForecastCards from './PricingForecastCards';
import ReputationHeader from './ReputationHeader';
import ReviewsSection, { type ReviewFilter } from './ReviewsSection';
import TopicClustering from './TopicClustering';
import VelocityPanel from './VelocityPanel';
import { analyzeReputation } from './reputation-analytics';
import { INITIAL_REVIEWS } from './reputation-data';

export default function ReputationDashboard() {
  const [reviews, setReviews] = useState<ReviewInput[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [showVelocity, setShowVelocity] = useState(false);
  const analytics = analyzeReputation(reviews);

  const visible = reviews.filter((review) => {
    if (filter === 'all') return true;
    return analytics.classify(review) === filter;
  });

  const autoReply = (review: ReviewInput): void => {
    setReplyTexts((current) => ({
      ...current,
      [review.id]: analytics.autoReply(review).suggestedReply,
    }));
  };

  const sendReply = (id: string): void => {
    if (!replyTexts[id]) return;
    setReviews((current) =>
      current.map((review) => (review.id === id ? { ...review, replied: true } : review))
    );
    setActiveReplyId(null);
    setReplyTexts((current) => ({ ...current, [id]: '' }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ReputationHeader
        summary={analytics.summary}
        showVelocity={showVelocity}
        onToggleVelocity={() => setShowVelocity((current) => !current)}
      />
      {showVelocity ? (
        <VelocityPanel
          analysis={analytics.velocityAnalysis}
          onClose={() => setShowVelocity(false)}
        />
      ) : null}
      <BenchmarkBanner summary={analytics.summary} />
      <PricingForecastCards
        pricingMatrix={analytics.pricingMatrix}
        trendForecast={analytics.trendForecast}
      />
      <TopicClustering topicAnalysis={analytics.topicAnalysis} />
      <ActionPlanAlerts
        actionPlan={analytics.actionPlan}
        sentimentAlerts={analytics.sentimentAlerts}
      />
      <ReviewsSection
        reviews={reviews}
        visible={visible}
        filter={filter}
        escalationCount={analytics.summary.escalationRequiredCount}
        activeReplyId={activeReplyId}
        replyTexts={replyTexts}
        classify={analytics.classify}
        onFilter={setFilter}
        onStartReply={setActiveReplyId}
        onCancelReply={() => setActiveReplyId(null)}
        onAiReply={autoReply}
        onReplyChange={(id, value) => setReplyTexts((current) => ({ ...current, [id]: value }))}
        onSendReply={sendReply}
      />
    </div>
  );
}
