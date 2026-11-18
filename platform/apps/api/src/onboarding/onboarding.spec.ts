import { InMemoryOnboardingRepository } from './application/in-memory-onboarding.repository';
import { GetOrCreateClientOnboardingUseCase, ClaimOnboardingOfferUseCase, CompleteOnboardingUseCase } from './application/onboarding.use-cases';

describe('Client Onboarding & Retention Sequence (T-4460)', () => {
  let repo: InMemoryOnboardingRepository;
  let getOrCreate: GetOrCreateClientOnboardingUseCase;
  let claimOffer: ClaimOnboardingOfferUseCase;
  let completeOnboarding: CompleteOnboardingUseCase;

  beforeEach(() => {
    repo = new InMemoryOnboardingRepository();
    getOrCreate = new GetOrCreateClientOnboardingUseCase(repo);
    claimOffer = new ClaimOnboardingOfferUseCase(repo);
    completeOnboarding = new CompleteOnboardingUseCase(repo);
  });

  it('creates first-visit onboarding sequence with personal welcome discount', async () => {
    const onboarding = await getOrCreate.execute({ clientId: 'cli_123', isFirstVisit: true, discountPercent: 20 });
    expect(onboarding.isFirstVisit).toBe(true);
    expect(onboarding.status).toBe('PENDING');
    expect(onboarding.welcomeDiscountCode).toContain('FIRST-');
    expect(onboarding.discountPercent).toBe(20);
  });

  it('allows claiming welcome offer and completing onboarding upon first completed visit', async () => {
  await getOrCreate.execute({ clientId: 'cli_456', isFirstVisit: true });
    
    const claimed = await claimOffer.execute('cli_456');
    expect(claimed.status).toBe('OFFER_CLAIMED');

    const completed = await completeOnboarding.execute('cli_456');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeInstanceOf(Date);
  });
});
