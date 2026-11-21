import type { HairProfile } from './ai-styling-presets';
import { FACE_SHAPES, LIFESTYLES } from './ai-styling-quiz-data';

interface AiStylingQuizStepProps {
  profile: HairProfile;
  isAnalyzing: boolean;
  onSelectShape: (shape: HairProfile['faceShape']) => void;
  onSelectLifestyle: (lifestyle: HairProfile['lifestyle']) => void;
  onRunAnalysis: () => void;
}

export function AiStylingQuizStep({
  profile,
  isAnalyzing,
  onSelectShape,
  onSelectLifestyle,
  onRunAnalysis,
}: AiStylingQuizStepProps) {
  return (
    <div className="space-y-8 bg-surface-sunken/50 p-6 md:p-10 rounded-card border border-line">
      <div>
        <label className="block text-sm font-semibold text-fg mb-3">
          1. Оберіть форму вашого обличчя:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {FACE_SHAPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectShape(item.id as HairProfile['faceShape'])}
              className={`flex flex-col items-center justify-center p-4 rounded-card border transition-all ${
                profile.faceShape === item.id
                  ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/25 scale-[1.02]'
                  : 'bg-surface border-line text-fg hover:border-accent-blue/50'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-fg mb-3">
          2. Ваш темп та стиль життя:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LIFESTYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectLifestyle(item.id as HairProfile['lifestyle'])}
              className={`p-4 rounded-card border text-left transition-all ${
                profile.lifestyle === item.id
                  ? 'bg-semantic-warning/15 border-semantic-warning text-fg shadow-md'
                  : 'bg-surface border-line text-fg-secondary hover:text-fg hover:border-line-hover'
              }`}
            >
              <div className="font-semibold text-sm text-fg mb-1">{item.label}</div>
              <div className="text-xs opacity-85">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-fg text-surface font-semibold text-body hover:bg-fg/90 transition-all shadow-xl disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-surface" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Аналізуємо пропорції та тренди...
            </>
          ) : (
            <>✨ Запустити FADE AI Консьєрж</>
          )}
        </button>
      </div>
    </div>
  );
}
