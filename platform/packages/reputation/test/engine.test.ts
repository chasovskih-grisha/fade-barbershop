import { ReputationEngine } from '../src';

describe('ReputationEngine', () => {
  let engine: ReputationEngine;

  beforeEach(() => {
    engine = new ReputationEngine();
  });

  test('analyzes review sentiment and extracts thematic tags correctly', () => {
    const analysis1 = engine.analyzeReviewText('Incredible skin fade and beard trim, best haircut in town!', 5);
    expect(analysis1.sentiment).toBe('POSITIVE');
    expect(analysis1.tags).toContain('fade');
    expect(analysis1.tags).toContain('beard');

    const analysis2 = engine.analyzeReviewText('Waited 45 minutes past my appointment time, very disappointed.', 2);
    expect(analysis2.sentiment).toBe('NEGATIVE');
    expect(analysis2.tags).toContain('wait_time');
  });

  test('processes post-appointment feedback and routes low ratings for management triage', () => {
    const resultLow = engine.processPostAppointmentFeedback('client_1', 'barber_1', 2, 'Uneven fade and rude service.');
    expect(resultLow.action).toBe('MANAGEMENT_TRIAGE');

    const resultHigh = engine.processPostAppointmentFeedback('client_2', 'barber_1', 5, 'Absolute perfection! Clean shop and fresh cut.');
    expect(resultHigh.action).toBe('PUBLIC_REVIEW_PROMPT');
  });

  test('calculates NPS and reputation summary metrics', () => {
    engine.addReview({
      id: 'r1',
      clientId: 'c1',
      barberId: 'b1',
      rating: 5,
      comment: 'Best fade ever!',
      source: 'GOOGLE',
      createdAt: new Date()
    });
    engine.addReview({
      id: 'r2',
      clientId: 'c2',
      barberId: 'b1',
      rating: 5,
      comment: 'Amazing service and clean shop.',
      source: 'GOOGLE',
      createdAt: new Date()
    });
    engine.addReview({
      id: 'r3',
      clientId: 'c3',
      barberId: 'b2',
      rating: 2,
      comment: 'Long wait time.',
      source: 'YELP',
      createdAt: new Date()
    });

    const summary = engine.getReputationSummary();
    expect(summary.totalReviews).toBe(3);
    expect(summary.averageRating).toBe(4);
    expect(summary.sentimentBreakdown.positive).toBe(2);
    expect(summary.sentimentBreakdown.negative).toBe(1);
    expect(summary.unrespondedNegativeCount).toBe(1);
  });

  test('benchmarks shop reputation against local competitors', () => {
    engine.addReview({
      id: 'r1',
      clientId: 'c1',
      barberId: 'b1',
      rating: 5,
      comment: 'Master fade!',
      source: 'GOOGLE',
      createdAt: new Date()
    });

    engine.setCompetitors([
      { competitorName: 'Downtown Cuts', averageRating: 4.6, totalReviews: 120, averageFadePrice: 50, responseRate: 70 },
      { competitorName: 'Sharp Edges Barbershop', averageRating: 4.3, totalReviews: 85, averageFadePrice: 40, responseRate: 50 }
    ]);

    const benchmark = engine.benchmarkAgainstMarket();
    expect(benchmark.marketLeader).toBeDefined();
    expect(benchmark.shopAverageRating).toBe(5);
    expect(benchmark.ratingRank).toBe(1);
  });

  test('generates barber scorecards and win-back offers for negative feedback', () => {
    engine.addReview({
      id: 'r_elife',
      clientId: 'c1',
      barberId: 'barber_pro',
      rating: 5,
      comment: 'Incredible skin fade and clean shop vibe!',
      source: 'GOOGLE',
      createdAt: new Date()
    });
    engine.addReview({
      id: 'r_neg',
      clientId: 'c2',
      barberId: 'barber_new',
      rating: 2,
      comment: 'Long wait time and uneven lineup.',
      source: 'INTERNAL_APP',
      createdAt: new Date()
    });

    const scorecards = engine.getBarberScorecards();
    expect(scorecards.length).toBe(2);
    const proCard = scorecards.find(s => s.barberId === 'barber_pro');
    expect(proCard?.performanceTier).toBe('ELITE');
    expect(proCard?.topStrengths).toContain('fade');

    const winBack = engine.generateWinBackOffer('r_neg');
    expect(winBack).not.toBeNull();
    expect(winBack?.offerCode).toContain('WINBACK_C2');
    expect(winBack?.message).toContain('50% discount');
  });
});
