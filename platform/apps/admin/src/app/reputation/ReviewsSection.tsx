import type { ReviewInput } from '@fade/domain-shared';
import ReviewCard from './ReviewCard';
import type { ReputationAnalytics } from './reputation-analytics';

export type ReviewFilter = 'all' | 'positive' | 'negative';

const FILTERS: Array<{ value: ReviewFilter; label: string; active: string }> = [
  { value: 'all', label: 'All Reviews', active: 'bg-surface-base text-white' },
  { value: 'positive', label: 'Positive', active: 'bg-emerald-600 text-white' },
  { value: 'negative', label: 'Needs Attention', active: 'bg-rose-600 text-white' },
];

export default function ReviewsSection({
  reviews,
  visible,
  filter,
  escalationCount,
  activeReplyId,
  replyTexts,
  classify,
  onFilter,
  onStartReply,
  onCancelReply,
  onAiReply,
  onReplyChange,
  onSendReply,
}: {
  reviews: ReviewInput[];
  visible: ReviewInput[];
  filter: ReviewFilter;
  escalationCount: number;
  activeReplyId: string | null;
  replyTexts: Record<string, string>;
  classify: ReputationAnalytics['classify'];
  onFilter: (filter: ReviewFilter) => void;
  onStartReply: (id: string) => void;
  onCancelReply: () => void;
  onAiReply: (review: ReviewInput) => void;
  onReplyChange: (id: string, value: string) => void;
  onSendReply: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-card border border-line shadow-sm overflow-hidden">
      <div className="p-4 border-b border-line flex justify-between items-center bg-surface-sunken">
        <h3 className="font-semibold text-fg">
          Customer Feedback &amp; Sentiment Stream ({reviews.length})
        </h3>
        <div className="flex gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilter(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === option.value
                  ? option.active
                  : 'bg-white text-fg-secondary border border-line hover:bg-interactive-hover'
              }`}
            >
              {option.label}
              {option.value === 'negative' ? ` (${escalationCount})` : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-line">
        {visible.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            sentiment={classify(review)}
            active={activeReplyId === review.id}
            replyText={replyTexts[review.id] ?? ''}
            onStart={() => onStartReply(review.id)}
            onCancel={onCancelReply}
            onAiReply={() => onAiReply(review)}
            onChange={(value) => onReplyChange(review.id, value)}
            onSend={() => onSendReply(review.id)}
          />
        ))}
      </div>
    </div>
  );
}
