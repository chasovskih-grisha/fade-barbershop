import { AnalyzeReviewFeedbackUseCase } from './analyze-review.use-case';
import { ReviewItem } from '../domain/reputation.entity';
import { ReputationRepository } from './ports';

describe('AnalyzeReviewFeedbackUseCase', () => {
  it('should analyze review sentiment and compute net promoter score', async () => {
    const reviewsStore: ReviewItem[] = [];
    const repo: ReputationRepository = {
      saveReview: async (r) => { reviewsStore.push(r); },
      listReviewsForLocation: async () => reviewsStore,
      getCompetitorBenchmarks: async () => [],
      saveCompetitorBenchmark: async () => {},
    };

    const useCase = new AnalyzeReviewFeedbackUseCase(repo);

    const result = await useCase.execute({
      id: 'rev-1',
      locationId: 'loc-1',
      clientId: 'client-1',
      rating: 5,
      sentimentScore: 0.9,
      source: 'INTERNAL_APP',
      comment: 'Amazing fade and clean shave!',
      createdAt: new Date(),
    });

    expect(result.sentiment).toEqual('POSITIVE');
    expect(result.npsScore).toEqual(100);
    expect(reviewsStore.length).toEqual(1);
  });
});
