import type { ReputationAnalytics } from './reputation-analytics';

export default function CompetitorActionPlan({
  plan,
}: {
  plan: ReputationAnalytics['actionPlan'];
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-h4 font-bold text-fg">🎯 Strategic Competitor Action Plan</h2>
          <p className="text-xs text-fg-muted">
            Autonomous recommendations to defend rating leadership and capture local market share.
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            plan.strategicPriority === 'High'
              ? 'bg-rose-100 text-semantic-danger'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          Priority: {plan.strategicPriority}
        </span>
      </div>
      <div className="bg-surface-sunken p-3 rounded-lg border border-line text-xs text-fg font-medium">
        💡 {plan.summaryRecommendation}
      </div>
      <div className="space-y-3">
        {plan.actionItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white border border-line rounded-lg shadow-sm"
          >
            <span className="text-sm">📌</span>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-fg">{item.title}</span>
                <span className="text-[10px] bg-surface-raised text-fg-secondary px-2 py-0.5 rounded font-semibold">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-fg-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
