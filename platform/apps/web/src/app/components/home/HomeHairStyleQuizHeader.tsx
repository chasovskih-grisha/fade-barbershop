interface HomeHairStyleQuizHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export function HomeHairStyleQuizHeader({ currentStep, totalSteps }: HomeHairStyleQuizHeaderProps) {
  return (
    <>
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs font-medium tracking-wider uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-pulse" />
          Interactive Style Concierge
        </div>
        <h2 className="text-3xl sm:text-4xl font-light tracking-wider text-white mb-4">
          Discover Your Signature{' '}
          <span className="font-semibold text-semantic-warning">FADE Aesthetic</span>
        </h2>
        <p className="text-fg-muted max-w-xl mx-auto text-base">
          Answer two quick questions to unlock a personalized master barber recommendation and a
          complimentary executive perk.
        </p>
      </div>

      <div className="flex items-center justify-between mb-8">
        <span className="text-xs uppercase tracking-wider text-semantic-warning font-medium">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="w-32 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-semantic-warning transition-all duration-500"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
