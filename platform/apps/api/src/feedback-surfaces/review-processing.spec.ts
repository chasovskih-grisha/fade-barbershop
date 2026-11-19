// Специфікація T-4451: відповідь адміна, статуси «новий/опрацьований/архів»,
// черга «неопрацьовані» і SLA. Домен, сервіс і HTTP-контролер.
import { BadRequestException } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import type { FeedbackSurfacesService } from './feedback-surfaces.service';
import {
  MAX_REVIEW_REPLY_LENGTH,
  REVIEW_SLA_HOURS,
  applyReply,
  applyStatus,
  canReply,
  slaState,
  slaSummary,
  sortUnprocessed,
  validateReply,
  type ReviewWorkItem,
} from './review-processing.policy';
import {
  InMemoryReviewProcessingRepository,
  ReviewProcessingService,
} from './review-processing.service';
import {
  InMemoryReviewRevaluationRepository,
  ReviewRevaluationService,
} from './review-revaluation.service';

const NOW = new Date('2026-11-19T12:00:00Z');
const HOUR = 60 * 60 * 1000;

function review(overrides: Partial<ReviewWorkItem> = {}): ReviewWorkItem {
  return {
    id: 'rev-1',
    appointmentId: 'apt-1',
    clientId: 'c-1',
    barberId: 'bar-1',
    rating: 2,
    submittedAt: new Date(NOW.getTime() - 2 * HOUR),
    status: 'new',
    replies: [],
    ...overrides,
  };
}

function service() {
  const repository = new InMemoryReviewProcessingRepository();
  return { repository, service: new ReviewProcessingService(repository) };
}

describe('review reply policy (T-4451)', () => {
  it('rejects empty and oversized replies', () => {
    expect(validateReply('   ')).toEqual(['Reply text is required']);
    expect(validateReply('а'.repeat(MAX_REVIEW_REPLY_LENGTH + 1))).toHaveLength(1);
    expect(validateReply('Дякуємо за відгук')).toEqual([]);
  });

  it('accepts the reply, marks the review processed and keeps the thread id', () => {
    const { review: updated, reply } = applyReply(
      review(),
      { adminId: 'admin-1', text: '  Вибачте за досвід, звʼяжемось з вами.  ', at: NOW },
      'rep-1'
    );

    expect(reply).toMatchObject({
      id: 'rep-1',
      reviewId: 'rev-1',
      threadSeq: 1,
      threadId: 'rev-1#1',
      adminId: 'admin-1',
      text: 'Вибачте за досвід, звʼяжемось з вами.',
    });
    expect(updated.status).toBe('processed');
    expect(updated.processedBy).toBe('admin-1');
    expect(updated.processedAt).toEqual(NOW);
    expect(updated.repliedAt).toEqual(NOW);
  });

  it('opens a new thread for a reply to a reply (risk: повторна відповідь)', () => {
    const first = applyReply(review(), { adminId: 'admin-1', text: 'Дякуємо', at: NOW }, 'rep-1');
    const second = applyReply(
      { ...first.review, status: 'processed' },
      { adminId: 'admin-1', text: 'Уточнюємо деталі', at: NOW },
      'rep-2'
    );

    expect(second.reply.threadSeq).toBe(2);
    expect(second.reply.threadId).toBe('rev-1#2');
    expect(second.review.status).toBe('processed');
    expect(second.review.repliedAt).toEqual(first.review.repliedAt);
    expect(second.review.replies).toHaveLength(2);
  });

  it('refuses to reply on an archived review until it is restored', () => {
    const archived = review({ status: 'archived' });

    expect(canReply(archived).allowed).toBe(false);
    expect(() => applyReply(archived, { adminId: 'admin-1', text: 'Привіт' }, 'rep-1')).toThrow(
      'restore it first'
    );
  });

  it('restores an archived review back to new and clears processing stamps', () => {
    const processed = review({ status: 'processed', processedBy: 'admin-1', processedAt: NOW });

    const restored = applyStatus(processed, 'new', 'admin-2', NOW);

    expect(restored.status).toBe('new');
    expect(restored.processedBy).toBeUndefined();
    expect(restored.processedAt).toBeUndefined();
    expect(applyStatus(restored, 'archived', 'admin-2', NOW).status).toBe('archived');
  });
});

describe('review SLA (T-4451)', () => {
  it('tracks ok → due_soon → breached → done across the 24h SLA', () => {
    expect(slaState(review({ submittedAt: new Date(NOW.getTime() - HOUR) }), NOW)).toBe('ok');
    expect(
      slaState(review({ submittedAt: new Date(NOW.getTime() - (REVIEW_SLA_HOURS - 2) * HOUR) }), NOW)
    ).toBe('due_soon');
    expect(
      slaState(review({ submittedAt: new Date(NOW.getTime() - 30 * HOUR) }), NOW)
    ).toBe('breached');
    expect(slaState(review({ status: 'processed' }), NOW)).toBe('done');
  });

  it('summarises coverage for the report', () => {
    const summary = slaSummary(
      [
        review({ id: 'r-new-fresh', submittedAt: new Date(NOW.getTime() - HOUR) }),
        review({ id: 'r-new-old', submittedAt: new Date(NOW.getTime() - 30 * HOUR) }),
        review({ id: 'r-processed', status: 'processed' }),
        review({ id: 'r-archived', status: 'archived' }),
      ],
      NOW
    );

    expect(summary.unprocessed).toBe(2);
    expect(summary.breached).toBe(1);
    expect(summary.processed).toBe(1);
    expect(summary.archived).toBe(1);
    expect(summary.oldestUnprocessedMinutes).toBe(30 * 60);
    expect(summary.slaHours).toBe(REVIEW_SLA_HOURS);
  });

  it('sorts unprocessed reviews oldest first and applies the limit after sorting', () => {
    const items = sortUnprocessed(
      [
        review({ id: 'r-new', submittedAt: new Date(NOW.getTime() - HOUR) }),
        review({ id: 'r-done', status: 'processed' }),
        review({ id: 'r-oldest', submittedAt: new Date(NOW.getTime() - 5 * HOUR) }),
      ],
      1
    );

    expect(items.map((item) => item.id)).toEqual(['r-oldest']);
  });
});

describe('ReviewProcessingService (T-4451)', () => {
  it('empties the unprocessed queue as reviews are answered', async () => {
    const { service: reviews } = service();
    await reviews.register(review({ id: 'rev-1' }));
    await reviews.register(review({ id: 'rev-2', submittedAt: new Date(NOW.getTime() - 3 * HOUR) }));

    expect((await reviews.listUnprocessed()).map((item) => item.id)).toEqual(['rev-2', 'rev-1']);

    await reviews.reply('rev-2', { adminId: 'admin-1', text: 'Дякуємо!' });

    expect((await reviews.listUnprocessed()).map((item) => item.id)).toEqual(['rev-1']);
  });

  it('persists the reply and the processed status for the caller', async () => {
    const { repository, service: reviews } = service();
    await reviews.register(review());

    const { reply } = await reviews.reply('rev-1', { adminId: 'admin-1', text: 'Дякуємо!' });
    const stored = await repository.findById('rev-1');

    expect(reply.threadId).toBe('rev-1#1');
    expect(stored?.status).toBe('processed');
    expect(stored?.replies[0]?.text).toBe('Дякуємо!');
    expect(stored?.processedBy).toBe('admin-1');
  });

  it('rejects unknown reviews and replies on archived ones', async () => {
    const { service: reviews } = service();
    await reviews.register(review({ id: 'rev-archived', status: 'archived' }));

    await expect(
      reviews.reply('missing', { adminId: 'admin-1', text: 'Привіт' })
    ).rejects.toThrow('not found');
    await expect(
      reviews.reply('rev-archived', { adminId: 'admin-1', text: 'Привіт' })
    ).rejects.toThrow('restore it first');
  });

  it('reports SLA coverage from stored reviews', async () => {
    const { service: reviews } = service();
    await reviews.register(review({ id: 'rev-old', submittedAt: new Date(NOW.getTime() - 30 * HOUR) }));
    await reviews.register(review({ id: 'rev-ok' }));

    const summary = await reviews.sla(NOW);

    expect(summary.unprocessed).toBe(2);
    expect(summary.breached).toBe(1);
  });
});

describe('FeedbackSurfacesController review routes (T-4451)', () => {
  function controller() {
    const { repository, service: reviews } = service();
    const stubSurfaces = {} as FeedbackSurfacesService;
    return {
      repository,
      reviews,
      controller: new FeedbackSurfacesController(
        stubSurfaces,
        reviews,
        new ReviewRevaluationService(new InMemoryReviewRevaluationRepository())
      ),
    };
  }

  it('serves the unprocessed queue with a limit', async () => {
    const { controller: api, reviews } = controller();
    await reviews.register(review({ id: 'rev-1' }));
    await reviews.register(review({ id: 'rev-2', submittedAt: new Date(NOW.getTime() - 3 * HOUR) }));

    const response = await api.unprocessedReviews('1');

    expect(response.data.total).toBe(1);
    expect(response.data.reviews[0]?.id).toBe('rev-2');
  });

  it('answers a review over HTTP and reports the processed status', async () => {
    const { controller: api, reviews } = controller();
    await reviews.register(review());

    const response = await api.replyToReview('rev-1', {
      adminId: 'admin-1',
      text: 'Дякуємо за відгук!',
    });

    expect(response.success).toBe(true);
    expect(response.data.review.status).toBe('processed');
    expect(response.data.reply.threadSeq).toBe(1);
  });

  it('maps policy failures to 400 and serves the SLA summary', async () => {
    const { controller: api, reviews } = controller();
    await reviews.register(review({ id: 'rev-archived', status: 'archived' }));

    await expect(
      api.replyToReview('rev-archived', { adminId: 'admin-1', text: 'Привіт' })
    ).rejects.toBeInstanceOf(BadRequestException);

    const sla = await api.reviewSla();
    expect(sla.data.unprocessed).toBe(0);
    expect(sla.data.archived).toBe(1);

    const restored = await api.setReviewStatus('rev-archived', {
      status: 'new',
      actorId: 'admin-2',
    });
    expect(restored.data.status).toBe('new');
  });
});
