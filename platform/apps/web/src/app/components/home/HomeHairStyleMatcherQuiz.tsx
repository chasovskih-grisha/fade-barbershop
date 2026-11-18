'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    icon: string;
    matchTag: string;
    recommendedService: string;
    serviceSlug: string;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is your primary grooming objective today?',
    subtitle: 'Select the look that best matches your lifestyle and ambition.',
    options: [
      {
        label: 'Executive Sharp & Polished',
        description: 'Immaculate fades, crisp contours, and boardroom-ready elegance.',
        icon: '💼',
        matchTag: 'executive',
        recommendedService: 'Royal Hot Towel Haircut & Beard Sculpt',
        serviceSlug: 'royal-haircut-beard',
      },
      {
        label: 'Effortless Modern Texture',
        description: 'Textured crop, natural flow, low maintenance with high impact.',
        icon: '⚡',
        matchTag: 'modern',
        recommendedService: 'Precision Fade & Texture Styling',
        serviceSlug: 'precision-fade',
      },
      {
        label: 'Beard Mastery & Transformation',
        description: 'Full beard contouring, hot oil treatment, and luxurious softening.',
        icon: '🧔',
        matchTag: 'beard',
        recommendedService: 'Signature Beard Spa & Hot Oil Ritual',
        serviceSlug: 'signature-beard-spa',
      },
      {
        label: 'Complete Executive Reset',
        description: 'The full VIP treatment: haircut, facial grooming, and scalp relaxation.',
        icon: '👑',
        matchTag: 'vip',
        recommendedService: 'Obsidian Crown VIP Grooming Experience',
        serviceSlug: 'obsidian-crown-vip',
      },
    ],
  },
  {
    id: 2,
    question: 'How frequently do you maintain your signature look?',
    subtitle: 'This helps our master barbers customize your optimal booking cadence.',
    options: [
      {
        label: 'Every 2 Weeks (Pristine Standard)',
        description: 'Always looking freshly styled for high-stakes meetings and events.',
        icon: '⏱️',
        matchTag: 'frequent',
        recommendedService: 'VIP Bi-Weekly Membership Club',
        serviceSlug: 'membership-vip',
      },
      {
        label: 'Every 3-4 Weeks (Balanced Maintenance)',
        description: 'Reliable upkeep ensuring clean lines and balanced proportions.',
        icon: '📅',
        matchTag: 'standard',
        recommendedService: 'Signature Fade & Styling',
        serviceSlug: 'signature-fade',
      },
      {
        label: 'Special Occasions & Milestone Prep',
        description: 'Bespoke styling tailored precisely for upcoming pivotal moments.',
        icon: '🌟',
        matchTag: 'occasion',
        recommendedService: 'Bespoke Concierge Grooming',
        serviceSlug: 'bespoke-concierge',
      },
    ],
  },
];

const defaultQ1 = quizQuestions[0]!;
const defaultQ2 = quizQuestions[1] || defaultQ1;

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

  const firstAns = selectedAnswers[0] ?? 0;
  const secondAns = selectedAnswers[1] ?? 0;

  const primaryChoice = defaultQ1.options[firstAns] || defaultQ1.options[0]!;
  const frequencyChoice = defaultQ2.options[secondAns] || defaultQ2.options[0]!;

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950 text-fg overflow-hidden border-t border-semantic-warning/15">
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-semantic-warning/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs font-medium tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-pulse" />
            Interactive Style Concierge
          </div>
          <h2 className="text-3xl sm:text-4xl font-light tracking-wider text-white mb-4">
            Discover Your Signature <span className="font-semibold text-semantic-warning">FADE Aesthetic</span>
          </h2>
          <p className="text-fg-muted max-w-xl mx-auto text-base">
            Answer two quick questions to unlock a personalized master barber recommendation and a complimentary executive perk.
          </p>
        </div>

        {/* Quiz Container Card */}
        <div className="bg-surface-raised backdrop-blur-xl border border-line rounded-card p-6 sm:p-10 shadow-2xl relative">
          {!isCompleted ? (
            <div>
              {/* Progress Bar */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs uppercase tracking-wider text-semantic-warning font-medium">
                  Step {currentStep + 1} of {quizQuestions.length}
                </span>
                <div className="w-32 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                  <div
                    className="h-full bg-semantic-warning transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                  {currentQ.question}
                </h3>
                <p className="text-fg-muted text-sm">{currentQ.subtitle}</p>
              </div>

              {/* Options Grid */}
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
                      <p className="text-fg-muted text-xs leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Results View */
            <div className="text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 bg-semantic-warning/10 border border-semantic-warning/30 text-semantic-warning rounded-card flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg">
                ✨
              </div>

              <span className="text-xs uppercase tracking-wider text-semantic-warning font-semibold block mb-2">
                Your Curated Master Prescription
              </span>

              <h3 className="text-2xl sm:text-3xl font-light text-white mb-3">
                {primaryChoice.label}
              </h3>

              <p className="text-fg-secondary max-w-lg mx-auto text-sm mb-8 leading-relaxed">
                Based on your preference for <span className="text-semantic-warning font-medium">{primaryChoice.description}</span> and your <span className="text-semantic-warning font-medium">{frequencyChoice.label}</span> schedule, our Master Barbers recommend:
              </p>

              {/* Recommended Service Card */}
              <div className="bg-surface-base border border-semantic-warning/30 rounded-card p-6 max-w-md mx-auto mb-8 text-left shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-semantic-warning text-ink text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Complimentary Perk Included
                </div>
                <div className="text-xs text-semantic-warning uppercase tracking-wider mb-1 font-medium">Recommended Experience</div>
                <div className="text-h4 font-semibold text-white mb-2">{primaryChoice.recommendedService}</div>
                <p className="text-xs text-fg-muted mb-4">Includes precision consultation, hot lather finish, and complimentary artisan beverage.</p>
                <div className="flex items-center justify-between pt-4 border-t border-line text-xs">
                  <span className="text-fg-secondary font-medium">Cadence: {frequencyChoice.label}</span>
                  <span className="text-semantic-warning font-semibold">Priority Booking Enabled</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/booking?service=${primaryChoice.serviceSlug}`}
                  className="w-full sm:w-auto px-8 py-4 rounded-card bg-gradient-to-r from-amber-500 to-amber-600 text-ink font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 text-center"
                >
                  Book Your Curated Session Now
                </Link>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-4 rounded-card bg-surface-raised text-fg-secondary hover:text-white hover:bg-interactive-hover transition-all text-sm font-medium"
                >
                  Retake Style Concierge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
