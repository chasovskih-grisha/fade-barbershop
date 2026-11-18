import { ClientOnboarding } from '../domain/onboarding.entity';
import type { OnboardingRepository } from './onboarding.repository';

export class GetOrCreateClientOnboardingUseCase {
  constructor(private readonly onboardingRepo: OnboardingRepository) {}

  async execute(input: { clientId: string; isFirstVisit: boolean; discountPercent?: number }): Promise<ClientOnboarding> {
    let existing = await this.onboardingRepo.findByClientId(input.clientId);
    if (existing) return existing;

    const onboarding = ClientOnboarding.create(input.clientId, input.isFirstVisit, input.discountPercent ?? 15);
    await this.onboardingRepo.save(onboarding);
    return onboarding;
  }
}

export class ClaimOnboardingOfferUseCase {
  constructor(private readonly onboardingRepo: OnboardingRepository) {}

  async execute(clientId: string): Promise<ClientOnboarding> {
    const onboarding = await this.onboardingRepo.findByClientId(clientId);
    if (!onboarding) {
      throw new Error('Onboarding profile not found for client');
    }

    onboarding.claimOffer();
    await this.onboardingRepo.save(onboarding);
    return onboarding;
  }
}

export class CompleteOnboardingUseCase {
  constructor(private readonly onboardingRepo: OnboardingRepository) {}

  async execute(clientId: string): Promise<ClientOnboarding> {
    const onboarding = await this.onboardingRepo.findByClientId(clientId);
    if (!onboarding) {
      throw new Error('Onboarding profile not found for client');
    }

    onboarding.completeOnboarding();
    await this.onboardingRepo.save(onboarding);
    return onboarding;
  }
}
