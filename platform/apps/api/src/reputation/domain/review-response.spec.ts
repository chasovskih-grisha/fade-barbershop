import { ReviewResponseTemplate } from './review-response.value-object';

describe('ReviewResponseTemplate', () => {
  it('generates correct template for positive review', () => {
    const text = ReviewResponseTemplate.getTemplate('POSITIVE', 'Alex');
    expect(text).toContain('stellar review');
    expect(text).toContain('Alex');
  });

  it('generates correct template for negative review', () => {
    const text = ReviewResponseTemplate.getTemplate('NEGATIVE', 'John');
    expect(text).toContain('sincerely sorry');
    expect(text).toContain('John');
  });

  it('correctly identifies escalation triggers', () => {
    expect(ReviewResponseTemplate.shouldEscalateToAdmin(1, -0.5)).toBe(true);
    expect(ReviewResponseTemplate.shouldEscalateToAdmin(5, 0.9)).toBe(false);
  });
});
