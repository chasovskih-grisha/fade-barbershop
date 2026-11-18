import { CompetitorBenchmark } from './competitor-benchmark.entity';

describe('CompetitorBenchmark Entity', () => {
  it('should create valid competitor benchmark and calculate metrics', () => {
    const benchmark = new CompetitorBenchmark({
      id: 'comp-1',
      locationId: 'loc-1',
      competitorName: 'Sharp & Co Barbers',
      platform: 'GOOGLE_MAPS',
      rating: 4.6,
      reviewCount: 340,
      averageHaircutPrice: 850, // cents
      sentimentScore: 0.82,
    });

    expect(benchmark.rating).toBe(4.6);
    expect(benchmark.isRatingHigherThan(4.2)).toBe(true);
    expect(benchmark.isRatingHigherThan(4.8)).toBe(false);
    expect(benchmark.priceDifferencePercent(700)).toBe(21.43);
  });

  it('should throw error on invalid rating or review count', () => {
    expect(() => {
      new CompetitorBenchmark({
        id: 'comp-2',
        locationId: 'loc-1',
        competitorName: 'Bad Cut',
        platform: 'GOOGLE_MAPS',
        rating: 5.5,
        reviewCount: 10,
        averageHaircutPrice: 500,
        sentimentScore: 0.5,
      });
    }).toThrow('Competitor rating must be between 1.0 and 5.0');

    expect(() => {
      new CompetitorBenchmark({
        id: 'comp-3',
        locationId: 'loc-1',
        competitorName: 'Negative Count',
        platform: 'FACEBOOK',
        rating: 4.0,
        reviewCount: -5,
        averageHaircutPrice: 500,
        sentimentScore: 0.0,
      });
    }).toThrow('Review count cannot be negative');
  });
});
