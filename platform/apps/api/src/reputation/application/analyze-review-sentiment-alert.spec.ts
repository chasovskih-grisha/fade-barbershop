import { AnalyzeReviewSentimentAlertUseCase } from './analyze-review-sentiment-alert.use-case';
import type { ReputationRepository } from './ports';
import { ReviewItem } from '../domain/reputation.entity';

describe('AnalyzeReviewSentimentAlertUseCase', () => {
  let useCase: AnalyzeReviewSentimentAlertUseCase;
  let mockRepo: jest.Mocked<ReputationRepository>;

  beforeEach(() => {
    mockRepo = {
      saveReview: jest.fn(),
      listReviewsForLocation: jest.fn(),
      getCompetitorBenchmarks: jest.fn(),
      saveCompetitorBenchmark: jest.fn(),
    };
    useCase = new AnalyzeReviewSentimentAlertUseCase(mockRepo);
  });

  it('triggers sentiment alert when negative reviews >= 2', async () => {
    const reviews: ReviewItem[] = [
      { id: '1', locationId: 'loc-1', clientId: 'c1', rating: 1, comment: 'Bad fade', sentimentScore: -0.8, source: 'INTERNAL_APP', createdAt: new Date() },
      { id: '2', locationId: 'loc-1', clientId: 'c2', rating: 2, comment: 'Uneven trim', sentimentScore: -0.4, source: 'INTERNAL_APP', createdAt: new Date() },
      { id: '3', locationId: 'loc-1', clientId: 'c3', rating: 5, comment: 'Great', sentimentScore: 0.9, source: 'INTERNAL_APP', createdAt: new Date() },
    ];
    mockRepo.listReviewsForLocation.mockResolvedValue(reviews);

    const report = await useCase.execute('loc-1');
    expect(report.alertTriggered).toBe(true);
    expect(report.negativeCount).toBe(2);
    expect(report.recommendedAction).toContain('High negative review velocity');
  });

  it('does not trigger sentiment alert when negative reviews < 2', async () => {
    const reviews: ReviewItem[] = [
      { id: '1', locationId: 'loc-1', clientId: 'c1', rating: 5, comment: 'Excellent', sentimentScore: 0.9, source: 'INTERNAL_APP', createdAt: new Date() },
    ];
    mockRepo.listReviewsForLocation.mockResolvedValue(reviews);

    const report = await useCase.execute('loc-1');
    expect(report.alertTriggered).toBe(false);
    expect(report.negativeCount).toBe(0);
    expect(report.recommendedAction).toContain('No immediate action required');
  });
});
