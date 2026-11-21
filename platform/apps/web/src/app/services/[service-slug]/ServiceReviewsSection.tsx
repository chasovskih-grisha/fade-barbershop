import type { ServiceReview } from './service-overview.types';

interface ServiceReviewsSectionProps {
  reviews: ServiceReview[];
  name: string;
}

export function ServiceReviewsSection({ reviews, name }: ServiceReviewsSectionProps) {
  return (
    <section className="rounded-card bg-surface-raised p-8 border border-line">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-h3 text-fg">Відгуки клієнтів про {name}</h2>
        <div className="flex items-center gap-2 text-sm text-accent font-semibold">
          <span>★ 4.9 з 5.0</span>
          <span className="text-fg-muted">({reviews.length} перевірених відгуків)</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev, idx) => (
          <div
            key={idx}
            className="rounded-card bg-surface border border-line p-6 flex flex-col justify-between gap-4 shadow-sm"
          >
            <p className="text-body text-fg-secondary italic">&ldquo;{rev.reviewBody}&rdquo;</p>
            <div className="flex items-center justify-between pt-3 border-t border-line text-caption">
              <div>
                <span className="font-bold text-fg block">{rev.author}</span>
                <span className="text-xs text-fg-muted">Верифікований відвідувач</span>
              </div>
              <div className="flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-full text-accent font-bold text-xs">
                <span>★</span> {rev.reviewRating.ratingValue}/5.0
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
