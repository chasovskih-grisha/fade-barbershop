import CompetitorActionPlan from './CompetitorActionPlan';
import SentimentAlertsCard from './SentimentAlertsCard';
import type { ReputationAnalytics } from './reputation-analytics';

export default function ActionPlanAlerts({
  actionPlan,
  sentimentAlerts,
}: {
  actionPlan: ReputationAnalytics['actionPlan'];
  sentimentAlerts: ReputationAnalytics['sentimentAlerts'];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CompetitorActionPlan plan={actionPlan} />
      <SentimentAlertsCard alerts={sentimentAlerts} />
    </div>
  );
}
