import { RECENT_VERIFIED_REVIEWS, type VerifiedReview } from './reputation-data';

interface ReputationReviewsProps {
  filterRating: number | 'all';
  onFilter: (rating: number | 'all') => void;
}

function ReviewCard({ review }: { review: VerifiedReview }) {
  return (
    <div className="p-6 rounded-card border border-line bg-surface shadow-md flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-caption font-bold text-fg">{review.author}</span>
          <span className="text-semantic-warning text-sm">★★★★★</span>
        </div>
        <span className="text-caption font-semibold text-accent-blue">{review.service}</span>
        <p className="text-body text-fg-secondary italic">&ldquo;{review.text}&rdquo;</p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-line text-caption text-fg-muted">
        <span>{review.date}</span>
        <span className="inline-flex items-center gap-1 text-accent-blue font-semibold">
          ✓ Верифікований візит
        </span>
      </div>
    </div>
  );
}

export function ReputationReviews({ filterRating, onFilter }: ReputationReviewsProps) {
  const reviews =
    filterRating === 'all'
      ? RECENT_VERIFIED_REVIEWS
      : RECENT_VERIFIED_REVIEWS.filter((rev) => rev.rating === filterRating);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="text-caption text-fg-secondary font-medium">Фільтрувати оцінку:</span>
        <button
          onClick={() => onFilter('all')}
          className={`px-3 py-1 rounded-pill text-caption font-semibold ${
            filterRating === 'all'
              ? 'bg-accent text-accent-fg'
              : 'bg-surface-sunken text-fg-secondary'
          }`}
        >
          Усі
        </button>
        <button
          onClick={() => onFilter(5)}
          className={`px-3 py-1 rounded-pill text-caption font-semibold ${
            filterRating === 5 ? 'bg-accent text-accent-fg' : 'bg-surface-sunken text-fg-secondary'
          }`}
        >
          5 зірок ★★★★★
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
