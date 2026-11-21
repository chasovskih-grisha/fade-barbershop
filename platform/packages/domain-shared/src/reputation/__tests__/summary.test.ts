import { ReputationEngine } from '../engine';
import { mockCompetitors, mockReviews } from '../test-fixtures';

describe('ReputationEngine summary and sentiment', () => {
  const engine = new ReputationEngine();

  it('calculates reputation summary metrics correctly', () => {
    const summary = engine.calculateSummary({
      reviews: mockReviews,
      competitorBenchmarks: mockCompetitors,
    });

    expect(summary.totalReviews).toBe(3);
    expect(summary.averageRating).toBe(3.3);
    expect(summary.sentimentBreakdown.positiveCount).toBe(1);
    expect(summary.sentimentBreakdown.negativeCount).toBe(1);
    expect(summary.sentimentBreakdown.neutralCount).toBe(1);
    expect(summary.responseMetrics.repliedCount).toBe(2);
    expect(summary.responseMetrics.pendingCount).toBe(1);
    expect(summary.escalationRequiredCount).toBe(1);
    expect(summary.competitiveComparison.marketAverageRating).toBe(4.4);
  });

  it('classifies sentiment accurately', () => {
    expect(engine.classifySentiment(5, 'Amazing work!')).toBe('positive');
    expect(engine.classifySentiment(1, 'Terrible service and rude staff.')).toBe('negative');
    expect(engine.classifySentiment(3, 'It was average.')).toBe('neutral');
    expect(engine.classifySentiment(3, 'Very disappointed with the wait time.')).toBe('negative');
  });

  it('generates appropriate auto-reply and escalation flags', () => {
    const positiveReply = engine.generateAutoReply({
      reviewId: 'rev-1',
      clientName: 'Alexander Wright',
      rating: 5,
      sentiment: 'positive',
      service: 'Executive Fade',
      barber: 'Dmytro K.',
    });
    expect(positiveReply.priority).toBe('low');
    expect(positiveReply.requiresEscalationToAdmin).toBe(false);
    expect(positiveReply.suggestedReply).toContain('Alexander');

    const negativeReply = engine.generateAutoReply({
      reviewId: 'rev-2',
      clientName: 'Viktor Hnativ',
      rating: 2,
      sentiment: 'negative',
      service: 'Beard Sculpting',
      barber: 'Oleg M.',
    });
    expect(negativeReply.priority).toBe('urgent');
    expect(negativeReply.requiresEscalationToAdmin).toBe(true);
    expect(negativeReply.suggestedReply).toContain('apologize');
  });
});
