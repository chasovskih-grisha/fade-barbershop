import type { ReputationAnalytics } from './reputation-analytics';

function tone(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-semantic-warning';
  return 'bg-rose-500';
}

export default function TopicClustering({
  topicAnalysis,
}: {
  topicAnalysis: ReputationAnalytics['topicAnalysis'];
}) {
  return (
    <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-h4 font-bold text-fg">
          🧠 Sentiment Topic Clustering &amp; Actionable Drivers
        </h2>
        <p className="text-xs text-fg-muted">
          AI-driven breakdown of feedback topics. Top Strength:{' '}
          <span className="font-semibold text-semantic-success">{topicAnalysis.topStrength}</span> •
          Focus Area:{' '}
          <span className="font-semibold text-semantic-danger">
            {topicAnalysis.primaryImprovementArea}
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {topicAnalysis.topics.map((topic) => (
          <div
            key={topic.topic}
            className="bg-surface-sunken border border-line rounded-lg p-4 space-y-2"
          >
            <div className="text-xs font-bold text-fg uppercase tracking-wider">{topic.topic}</div>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-bold text-fg">{topic.averageRating} ⭐</span>
              <span className="text-xs font-semibold text-fg-muted">
                {topic.mentionCount} mentions
              </span>
            </div>
            <div className="w-full bg-interactive h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${tone(topic.sentimentScore)}`}
                style={{ width: `${topic.sentimentScore}%` }}
              />
            </div>
            <div className="text-[11px] text-fg-muted">Drivers: {topic.keyDrivers.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
