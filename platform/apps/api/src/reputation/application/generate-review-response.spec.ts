import { GenerateReviewResponseUseCase } from './generate-review-response.use-case';

describe('GenerateReviewResponseUseCase', () => {
  let useCase: GenerateReviewResponseUseCase;

  beforeEach(() => {
    useCase = new GenerateReviewResponseUseCase();
  });

  it('generates warm positive response for 5-star review', () => {
    const res = useCase.execute({
      customerName: 'Alex',
      rating: 5,
      reviewText: 'Best fade in town!',
    });

    expect(res.sentiment).toBe('POSITIVE');
    expect(res.needsEscalation).toBe(false);
    expect(res.suggestedResponse).toContain('Alex');
    expect(res.suggestedResponse).toContain('stellar review');
  });

  it('generates apologetic response and triggers escalation for 1-star review', () => {
    const res = useCase.execute({
      customerName: 'John',
      rating: 1,
      reviewText: 'Waited 45 minutes past my slot.',
    });

    expect(res.sentiment).toBe('NEGATIVE');
    expect(res.needsEscalation).toBe(true);
    expect(res.responseTone).toBe('APOLOGETIC');
    expect(res.suggestedResponse).toContain('sincerely apologize');
  });

  it('generates VIP customized response when requested', () => {
    const res = useCase.execute({
      customerName: 'Marcus',
      rating: 5,
      reviewText: 'Always top tier service.',
      tone: 'VIP',
      isVip: true,
    });

    expect(res.responseTone).toBe('VIP');
    expect(res.suggestedResponse).toContain('valued VIP guests');
  });
});
