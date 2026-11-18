import { ClientOnboarding } from '../domain/onboarding.entity';

export interface OnboardingRepository {
  save(onboarding: ClientOnboarding): Promise<void>;
  findByClientId(clientId: string): Promise<ClientOnboarding | null>;
  findById(id: string): Promise<ClientOnboarding | null>;
}
