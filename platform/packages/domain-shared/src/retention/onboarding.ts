import type { OnboardingSequenceRequest, OnboardingSequenceResult, OnboardingStep } from './types';

type Stage = OnboardingSequenceResult['currentStage'];

function buildSteps(request: OnboardingSequenceRequest): OnboardingStep[] {
  const code = request.clientId.slice(0, 6).toUpperCase();
  return [
    {
      stepDay: 0,
      channel: 'sms',
      templateKey: 'WELCOME_SIGNUP',
      description: `Welcome to FADE, ${request.clientName}! Your first cut awaits.`,
    },
    {
      stepDay: 7,
      channel: 'push',
      templateKey: 'FIRST_REBOOKING_REMINDER',
      incentiveCode: `ONB-${code}-10`,
      description: 'Keep your fresh look! Enjoy 10% off your second visit.',
    },
    {
      stepDay: 14,
      channel: 'whatsapp',
      templateKey: 'REFERRAL_PROGRAM_PROMPT',
      incentiveCode: `REF-${code}`,
      description:
        'Invite a friend to FADE and get $15 bonus credit when they complete their visit.',
    },
  ];
}

function resolveStage(daysSinceRegistration: number): Stage {
  if (daysSinceRegistration >= 14) return 'referral_prompt';
  if (daysSinceRegistration >= 7) return 'first_rebooking';
  return 'welcome';
}

/**
 * Calculate automated client onboarding retention sequence.
 */
export function calculateOnboardingSequence(
  request: OnboardingSequenceRequest
): OnboardingSequenceResult {
  const steps = buildSteps(request);
  const nextStep = steps.find((step) => step.stepDay > request.daysSinceRegistration);

  return {
    clientId: request.clientId,
    currentStage: resolveStage(request.daysSinceRegistration),
    ...(nextStep ? { nextScheduledStep: nextStep } : {}),
    availableSteps: steps,
  };
}
