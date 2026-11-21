import type { ReputationAnalytics } from './reputation-analytics';

export default function BenchmarkBanner({ summary }: { summary: ReputationAnalytics['summary'] }) {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-card p-6 shadow-md">
      <h2 className="text-h4 font-semibold mb-3">📍 Local Competitive Benchmark (Kyiv District)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
          <div className="text-sm text-accent-blue">FADE Platform (Us)</div>
          <div className="text-2xl font-bold mt-1">
            {summary.averageRating} ⭐{' '}
            <span className="text-xs font-normal text-semantic-success">
              +{summary.competitiveComparison.ratingDeltaVsMarket} vs market
            </span>
          </div>
          <div className="text-xs text-fg-muted mt-2">
            Response rate: {summary.responseMetrics.responseRatePct}% • Escalations:{' '}
            {summary.escalationRequiredCount}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/5">
          <div className="text-sm text-fg-secondary">Gentlemen&apos;s Club Barbershop</div>
          <div className="text-2xl font-bold mt-1">4.5 ⭐</div>
          <div className="text-xs text-fg-muted mt-2">
            Response rate: 45% • Avg reply time: 12.0h
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/5">
          <div className="text-sm text-fg-secondary">Sharp &amp; Co.</div>
          <div className="text-2xl font-bold mt-1">4.3 ⭐</div>
          <div className="text-xs text-fg-muted mt-2">
            Response rate: 30% • Avg reply time: 24.0h
          </div>
        </div>
      </div>
    </div>
  );
}
