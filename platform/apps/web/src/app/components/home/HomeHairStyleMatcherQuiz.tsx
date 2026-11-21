'use client';

import { useState } from 'react';
import { defaultQ1, defaultQ2, quizQuestions } from './home-hair-style-quiz-data';
import { HomeHairStyleQuizHeader } from './HomeHairStyleQuizHeader';
import { HomeHairStyleQuizResult } from './HomeHairStyleQuizResult';

export function HomeHairStyleMatcherQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleOptionSelect = (optionIndex: number) => {
    const updatedAnswers = [...selectedAnswers, optionIndex];
    setSelectedAnswers(updatedAnswers);

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedAnswers([]);
    setIsCompleted(false);
  };

  const currentQ = quizQuestions[currentStep] || defaultQ1;
  const primaryChoice = defaultQ1.options[selectedAnswers[0] ?? 0] || defaultQ1.options[0]!;
  const frequencyChoice = defaultQ2.options[selectedAnswers[1] ?? 0] || defaultQ2.options[0]!;

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950 text-fg overflow-hidden border-t border-semantic-warning/15">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-semantic-warning/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <HomeHairStyleQuizHeader currentStep={currentStep} totalSteps={quizQuestions.length} />

        <div className="bg-surface-raised backdrop-blur-xl border border-line rounded-card p-6 sm:p-10 shadow-2xl relative">
          {!isCompleted ? (
            <div>
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                  {currentQ.question}
                </h3>
                <p className="text-fg-muted text-sm">{currentQ.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className="group text-left p-5 rounded-card bg-surface-base border border-line hover:border-semantic-warning/50 hover:bg-interactive-hover transition-all duration-300 flex items-start gap-4 cursor-pointer shadow-md hover:shadow-amber-500/5"
                  >
                    <span className="text-3xl p-2.5 rounded-lg bg-surface-raised border border-line group-hover:scale-110 transition-transform duration-300">
                      {option.icon}
                    </span>
                    <div>
                      <h4 className="text-white font-medium text-base group-hover:text-semantic-warning transition-colors mb-1">
                        {option.label}
                      </h4>
                      <p className="text-fg-muted text-xs leading-relaxed">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <HomeHairStyleQuizResult
              primaryChoice={primaryChoice}
              frequencyChoice={frequencyChoice}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </section>
  );
}
