'use client';

import { useState } from 'react';
import { STYLE_PRESETS, type HairProfile } from './ai-styling-presets';
import { AiStylingQuizStep } from './AiStylingQuizStep';
import { AiStylingResultsStep } from './AiStylingResultsStep';

export function AIStylingConcierge() {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<HairProfile>({
    faceShape: 'oval',
    hairType: 'straight',
    lifestyle: 'business',
    beardGoal: 'stubble',
  });
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleSelectShape = (shape: HairProfile['faceShape']) => {
    setProfile((prev) => ({ ...prev, faceShape: shape }));
  };

  const handleSelectLifestyle = (life: HairProfile['lifestyle']) => {
    setProfile((prev) => ({ ...prev, lifestyle: life }));
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(2);
      const recs = STYLE_PRESETS[profile.faceShape] || STYLE_PRESETS.oval;
      const first = recs[0];
      if (first) setSelectedStyleId(first.id);
    }, 1200);
  };

  const currentRecs = STYLE_PRESETS[profile.faceShape] || STYLE_PRESETS.oval;
  const activeRecommendation = (
    currentRecs.length > 0
      ? currentRecs.find((r) => r.id === selectedStyleId) || currentRecs[0]
      : STYLE_PRESETS.oval[0]
  )!;

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-14 shadow-2xl my-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-semantic-warning/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/10 border border-semantic-warning/30 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning">
            ✨ FADE AI • Інтелектуальний Консьєрж Стилю
          </div>
          <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">
            Підберіть свій ідеальний образ за допомогою AI
          </h2>
          <p className="text-body text-fg-secondary max-w-xl mx-auto">
            Наша нейромережа аналізує геометрію обличчя, тип волосся та стиль життя, щоб
            порекомендувати бездоганну стрижку та майстра.
          </p>
        </div>

        {step === 1 && (
          <AiStylingQuizStep
            profile={profile}
            isAnalyzing={isAnalyzing}
            onSelectShape={handleSelectShape}
            onSelectLifestyle={handleSelectLifestyle}
            onRunAnalysis={handleRunAnalysis}
          />
        )}

        {step === 2 && (
          <AiStylingResultsStep
            recommendations={currentRecs}
            activeRecommendation={activeRecommendation}
            selectedStyleId={selectedStyleId}
            onSelectStyle={setSelectedStyleId}
            onChangeParams={() => setStep(1)}
          />
        )}
      </div>
    </section>
  );
}
