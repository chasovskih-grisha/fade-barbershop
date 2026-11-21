import type { ReputationAnalytics } from './reputation-analytics';

const METRICS = [
  {
    label: 'Growth Velocity (FADE)',
    value: (data: ReputationAnalytics['velocityAnalysis']) =>
      `${data.fadeReviewGrowthVelocity} rev/mo`,
    tone: 'text-accent-blue',
  },
  {
    label: 'Share of Voice',
    value: (data: ReputationAnalytics['velocityAnalysis']) => `${data.fadeMarketShareOfVoice}%`,
    tone: 'text-semantic-success',
  },
  {
    label: 'Competitive Rank',
    value: (data: ReputationAnalytics['velocityAnalysis']) => `#${data.competitiveRank} in Kyiv`,
    tone: 'text-fg',
  },
  {
    label: 'Threat Level',
    value: (data: ReputationAnalytics['velocityAnalysis']) => data.threatLevel,
    tone: 'text-semantic-warning',
  },
];

export default function VelocityPanel({
  analysis,
  onClose,
}: {
  analysis: ReputationAnalytics['velocityAnalysis'];
  onClose: () => void;
}) {
  return (
    <div className="bg-accent-blue/10 border border-accent-blue rounded-card p-6 shadow-inner space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 font-bold text-fg">
          🚀 Competitor Review Velocity &amp; Market Share Analysis
        </h2>
        <button onClick={onClose} className="text-xs text-accent-blue hover:text-fg font-semibold">
          ✕ Close Panel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm"
          >
            <div className="text-xs text-fg-muted">{metric.label}</div>
            <div className={`text-xl font-bold mt-1 uppercase ${metric.tone}`}>
              {metric.value(analysis)}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-lg border border-accent-blue shadow-sm space-y-2">
        <div className="text-xs font-semibold text-fg uppercase">AI Strategic Recommendations:</div>
        <ul className="list-disc list-inside text-sm text-fg-secondary space-y-1">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
