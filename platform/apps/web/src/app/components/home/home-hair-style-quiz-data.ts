export interface QuizQuestion {
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

export const quizQuestions: QuizQuestion[] = [
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

export const defaultQ1 = quizQuestions[0]!;
export const defaultQ2 = quizQuestions[1] || defaultQ1;
