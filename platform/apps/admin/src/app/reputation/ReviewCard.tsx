import type { ReviewInput } from '@fade/domain-shared';
import ReviewReplyComposer from './ReviewReplyComposer';
import type { ReputationAnalytics } from './reputation-analytics';

export default function ReviewCard({
  review,
  sentiment,
  active,
  replyText,
  onStart,
  onCancel,
  onAiReply,
  onChange,
  onSend,
}: {
  review: ReviewInput;
  sentiment: ReturnType<ReputationAnalytics['classify']>;
  active: boolean;
  replyText: string;
  onStart: () => void;
  onCancel: () => void;
  onAiReply: () => void;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const sentimentTone =
    sentiment === 'positive'
      ? 'bg-semantic-success/10 text-emerald-700'
      : sentiment === 'negative'
        ? 'bg-semantic-danger/10 text-semantic-danger'
        : 'bg-amber-50 text-amber-700';

  return (
    <div className="p-5 hover:bg-surface-sunken transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-fg">{review.clientName}</span>
            <span className="text-xs bg-surface-raised text-fg-secondary px-2 py-0.5 rounded font-medium">
              {review.platform}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${sentimentTone}`}>
              {sentiment}
            </span>
          </div>
          <div className="text-xs text-fg-muted mt-0.5">
            Service: {review.service} • Barber: {review.barber} • {review.date}
          </div>
        </div>
        <div className="text-semantic-warning font-bold">{'⭐'.repeat(review.rating)}</div>
      </div>

      <p className="mt-3 text-fg text-sm bg-surface-sunken p-3 rounded-lg border border-line">
        &quot;{review.comment}&quot;
      </p>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-xs text-fg-muted">
          {review.replied ? (
            <span className="text-semantic-success font-medium">✓ Replied &amp; Resolved</span>
          ) : (
            <span className="text-semantic-warning font-medium">⚠ Pending management response</span>
          )}
        </div>
        {!review.replied && !active ? (
          <button
            onClick={onStart}
            className="px-3 py-1 text-xs font-medium bg-surface-base text-white rounded hover:bg-interactive-hover transition"
          >
            Reply &amp; Resolve
          </button>
        ) : null}
      </div>

      {active ? (
        <ReviewReplyComposer
          replyText={replyText}
          onAiReply={onAiReply}
          onCancel={onCancel}
          onChange={onChange}
          onSend={onSend}
        />
      ) : null}
    </div>
  );
}
