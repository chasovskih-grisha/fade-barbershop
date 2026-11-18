import { ClientOnboarding } from '../domain/onboarding.entity';
import type { OnboardingRepository } from './onboarding.repository';

export class InMemoryOnboardingRepository implements OnboardingRepository {
  private items = new Map<string, ClientOnboarding>();

  async save(onboarding: ClientOnboarding): Promise<void> {
    this.items.set(onboarding.id, onboarding);
    this.items.set(`client_${onboarding.clientId}`, onboarding);
  }

  async findByClientId(clientId: string): Promise<ClientOnboarding | null> {
    return this.items.get(`client_${clientId}`) || null;
  }

  async findById(id: string): Promise<ClientOnboarding | null> {
    return this.items.get(id) || null;
  }
}
