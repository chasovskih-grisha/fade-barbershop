import type { ReputationAnalytics } from './reputation-analytics';

export default function ReputationHeader({
  summary,
  showVelocity,
  onToggleVelocity,
}: {
  summary: ReputationAnalytics['summary'];
  showVelocity: boolean;
  onToggleVelocity: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-wider text-fg">
          Reputation &amp; Competitive Intelligence
        </h1>
        <p className="text-sm text-fg-muted">
          Monitor review sentiment, benchmark local competitors, and engage clients in real-time via
          FADE Reputation Engine.
        </p>
      </div>
      <div className="flex gap-3 items-center">
        <div className="bg-white border border-line rounded-lg px-4 py-2 text-center shadow-sm">
          <div className="text-xs text-fg-muted font-medium uppercase">Avg Rating</div>
          <div className="text-h4 font-bold text-fg">⭐ {summary.averageRating} / 5.0</div>
        </div>
        <div className="bg-white border border-line rounded-lg px-4 py-2 text-center shadow-sm">
          <div className="text-xs text-fg-muted font-medium uppercase">Sentiment</div>
          <div className="text-h4 font-bold text-semantic-success">
            {summary.sentimentBreakdown.positivePercentage}% Positive
          </div>
        </div>
        <button
          onClick={onToggleVelocity}
          className="px-4 py-2 bg-accent-blue text-white font-medium rounded-lg text-sm shadow hover:bg-accent-blue transition"
        >
          📊 Competitor Velocity{showVelocity ? ' ✕' : ''}
        </button>
      </div>
    </div>
  );
}
