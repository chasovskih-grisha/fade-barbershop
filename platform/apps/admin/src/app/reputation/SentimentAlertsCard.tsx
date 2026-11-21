import type { ReputationAnalytics } from './reputation-analytics';

export default function SentimentAlertsCard({
  alerts,
}: {
  alerts: ReputationAnalytics['sentimentAlerts'];
}) {
  return (
    <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 font-bold text-fg">⚡ Sentiment Alert Rules</h2>
        <span className="text-xs font-bold bg-semantic-warning/15 text-semantic-warning px-2 py-0.5 rounded">
          {alerts.totalTriggered} Triggered
        </span>
      </div>
      <p className="text-xs text-fg-muted">
        Active automated triggers monitoring real-time review sentiment &amp; escalations.
      </p>
      <div className="space-y-3">
        {alerts.triggeredAlerts.map((alert) => (
          <div
            key={alert.ruleId}
            className="p-3 bg-semantic-danger/10 border border-semantic-danger rounded-lg space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-semantic-danger">{alert.ruleName}</span>
              <span className="text-[10px] uppercase font-bold bg-semantic-danger/15 text-semantic-danger px-1.5 py-0.5 rounded">
                Critical
              </span>
            </div>
            <p className="text-xs text-semantic-danger">{alert.message}</p>
          </div>
        ))}
        {alerts.totalTriggered === 0 ? (
          <div className="p-4 bg-semantic-success/10 border border-semantic-success rounded-lg text-xs text-semantic-success font-medium text-center">
            ✓ All sentiment rules normal. No escalation alerts triggered.
          </div>
        ) : null}
      </div>
    </div>
  );
}
