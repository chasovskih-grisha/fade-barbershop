import Link from 'next/link';
import type { QuizQuestion } from './home-hair-style-quiz-data';

type QuizOption = QuizQuestion['options'][number];

interface HomeHairStyleQuizResultProps {
  primaryChoice: QuizOption;
  frequencyChoice: QuizOption;
  onReset: () => void;
}

export function HomeHairStyleQuizResult({
  primaryChoice,
  frequencyChoice,
  onReset,
}: HomeHairStyleQuizResultProps) {
  return (
    <div className="text-center py-6 animate-fadeIn">
      <div className="w-16 h-16 bg-semantic-warning/10 border border-semantic-warning/30 text-semantic-warning rounded-card flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg">
        ✨
      </div>

      <span className="text-xs uppercase tracking-wider text-semantic-warning font-semibold block mb-2">
        Your Curated Master Prescription
      </span>

      <h3 className="text-2xl sm:text-3xl font-light text-white mb-3">{primaryChoice.label}</h3>

      <p className="text-fg-secondary max-w-lg mx-auto text-sm mb-8 leading-relaxed">
        Based on your preference for{' '}
        <span className="text-semantic-warning font-medium">{primaryChoice.description}</span> and
        your <span className="text-semantic-warning font-medium">{frequencyChoice.label}</span>{' '}
        schedule, our Master Barbers recommend:
      </p>

      <div className="bg-surface-base border border-semantic-warning/30 rounded-card p-6 max-w-md mx-auto mb-8 text-left shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-semantic-warning text-ink text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
          Complimentary Perk Included
        </div>
        <div className="text-xs text-semantic-warning uppercase tracking-wider mb-1 font-medium">
          Recommended Experience
        </div>
        <div className="text-h4 font-semibold text-white mb-2">
          {primaryChoice.recommendedService}
        </div>
        <p className="text-xs text-fg-muted mb-4">
          Includes precision consultation, hot lather finish, and complimentary artisan beverage.
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-line text-xs">
          <span className="text-fg-secondary font-medium">Cadence: {frequencyChoice.label}</span>
          <span className="text-semantic-warning font-semibold">Priority Booking Enabled</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/booking?service=${primaryChoice.serviceSlug}`}
          className="w-full sm:w-auto px-8 py-4 rounded-card bg-gradient-to-r from-amber-500 to-amber-600 text-ink font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 text-center"
        >
          Book Your Curated Session Now
        </Link>
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-4 rounded-card bg-surface-raised text-fg-secondary hover:text-white hover:bg-interactive-hover transition-all text-sm font-medium"
        >
          Retake Style Concierge
        </button>
      </div>
    </div>
  );
}
