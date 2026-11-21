import {
  ProcessReviewEscalationUseCase,
  AdminNotifier,
} from './process-review-escalation.use-case';
import { ReviewItem } from '../domain/reputation.entity';

describe('ProcessReviewEscalationUseCase', () => {
  it('escalates negative review and notifies admin', async () => {
    const notifier: AdminNotifier = {
      notifyNegativeEscalation: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ProcessReviewEscalationUseCase(notifier);

    const review: ReviewItem = {
      id: 'rev-1',
      locationId: 'loc-1',
      clientId: 'client-1',
      rating: 1,
      sentimentScore: -0.8,
      source: 'GOOGLE_MAPS',
      comment: 'Terrible haircut',
      createdAt: new Date(),
    };

    const result = await useCase.execute(review);

    expect(result.sentiment).toBe('NEGATIVE');
    expect(result.escalatedToAdmin).toBe(true);
    expect(result.autoResponse).toContain('sincerely sorry');
    expect(notifier.notifyNegativeEscalation).toHaveBeenCalledWith(review);
  });
});
