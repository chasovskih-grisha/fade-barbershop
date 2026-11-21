import type { ReputationAnalytics } from './reputation-analytics';

export default function PricingForecastCards({
  pricingMatrix,
  trendForecast,
}: {
  pricingMatrix: ReputationAnalytics['pricingMatrix'];
  trendForecast: ReputationAnalytics['trendForecast'];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-3">
        <h3 className="text-body font-bold text-fg">
          🏷️ Competitor Pricing &amp; Positioning Matrix
        </h3>
        <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
          <span>Market Avg Price:</span>
          <span className="font-bold text-fg">${pricingMatrix.marketAveragePrice}</span>
        </div>
        <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
          <span>Positioning Category:</span>
          <span className="font-bold text-accent-blue">{pricingMatrix.positioningCategory}</span>
        </div>
        <div className="text-xs text-fg-muted bg-accent-blue/10 p-3 rounded-lg border border-accent-blue">
          <span className="font-semibold">AI Recommendation:</span> {pricingMatrix.recommendation}
        </div>
      </div>
      <div className="bg-white rounded-card border border-line shadow-sm p-6 space-y-3">
        <h3 className="text-body font-bold text-fg">
          📈 Review Sentiment Trend &amp; Loyalty Forecast
        </h3>
        <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
          <span>Projected Next Month Rating:</span>
          <span className="font-bold text-semantic-success">
            {trendForecast.projectedNextMonthRating} ⭐
          </span>
        </div>
        <div className="text-sm text-fg-secondary flex justify-between items-center bg-surface-sunken p-3 rounded-lg">
          <span>Brand Loyalty Score:</span>
          <span className="font-bold text-accent-blue">
            {trendForecast.brandLoyaltyScore} / 100
          </span>
        </div>
        <div className="text-xs text-fg-muted bg-semantic-success/10 p-3 rounded-lg border border-semantic-success">
          <span className="font-semibold">Trajectory Insights:</span>{' '}
          {trendForecast.forecastingInsights[0]}
        </div>
      </div>
    </div>
  );
}
