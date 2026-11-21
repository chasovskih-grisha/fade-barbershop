import Link from 'next/link';
import type { Recommendation } from './ai-styling-presets';

interface AiStylingResultsStepProps {
  recommendations: Recommendation[];
  activeRecommendation: Recommendation;
  selectedStyleId: string;
  onSelectStyle: (id: string) => void;
  onChangeParams: () => void;
}

export function AiStylingResultsStep({
  recommendations,
  activeRecommendation,
  selectedStyleId,
  onSelectStyle,
  onChangeParams,
}: AiStylingResultsStepProps) {
  return (
    <div className="space-y-8">
      <div className="bg-surface-sunken/60 p-6 md:p-8 rounded-card border border-line flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-semantic-warning text-xs font-semibold uppercase tracking-wider mb-2">
            ✓ Аналіз успішно завершено (Збіг: {activeRecommendation.matchScore}%)
          </div>
          <h3 className="font-display text-h3 font-bold text-fg">{activeRecommendation.name}</h3>
          <p className="text-body-sm text-fg-secondary mt-1">{activeRecommendation.description}</p>
        </div>

        <div className="flex items-center gap-4 bg-surface p-4 rounded-card border border-line shrink-0">
          <div>
            <div className="text-caption text-fg-secondary">Вартість / Час</div>
            <div className="font-display font-bold text-h4 text-fg">
              {activeRecommendation.price} ₴
            </div>
            <div className="text-xs text-accent-blue">{activeRecommendation.duration} хв</div>
          </div>
          <Link
            href={`/booking?style=${activeRecommendation.id}&barber=${encodeURIComponent(activeRecommendation.recommendedBarber)}`}
            className="px-6 py-3 rounded-card bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25 transition-all text-center"
          >
            Записатись на цей образ →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            onClick={() => onSelectStyle(rec.id)}
            className={`p-5 rounded-card border cursor-pointer transition-all ${
              selectedStyleId === rec.id
                ? 'bg-surface-raised border-accent-blue shadow-lg ring-1 ring-accent-blue/30'
                : 'bg-surface border-line hover:border-line-hover opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-accent-blue/10 text-accent-blue">
                {rec.matchScore}% Збіг
              </span>
              <span className="font-bold text-fg">{rec.price} ₴</span>
            </div>
            <h4 className="font-display font-bold text-fg mb-1">{rec.name}</h4>
            <p className="text-xs text-fg-secondary mb-3">{rec.subtitle}</p>
            <div className="text-xs font-medium text-semantic-warning mb-3">
              Рекомендований майстер: {rec.recommendedBarber}
            </div>
            <ul className="space-y-1.5 text-xs text-fg-secondary">
              {rec.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent-blue">✓</span> {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onChangeParams}
          className="text-sm font-medium text-fg-secondary hover:text-fg underline transition-all"
        >
          ← Змінити параметри аналізу обличчя
        </button>
      </div>
    </div>
  );
}
