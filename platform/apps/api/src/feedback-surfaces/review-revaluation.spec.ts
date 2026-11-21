/* eslint-disable max-lines -- cohesive module (229 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4463: закритий цикл відгуку — повторна оцінка, стан «закрито»,
// повторний запит після відповіді адміна й допуск до публічної вітрини.
import { BadRequestException } from '@nestjs/common';
import { FeedbackSurfacesController } from './feedback-surfaces.controller';
import type { FeedbackSurfacesService } from './feedback-surfaces.service';
import type { ReviewProcessingService } from './review-processing.service';
import {
  MAX_REVIEW_TEXT_LENGTH,
  SHOWCASE_MIN_TEXT_LENGTH,
  applyClientRating,
  canEditRating,
  closeLoop,
  isShowcaseQualityText,
  moderateShowcase,
  openRevaluation,
  publicShowcaseEligibility,
  recordAdminReply,
  revaluationSummary,
  shouldAskForRevaluation,
  validateRatingInput,
  type ReviewRevaluation,
} from './review-revaluation.policy';
import {
  InMemoryReviewRevaluationRepository,
  ReviewRevaluationService,
} from './review-revaluation.service';

const NOW = new Date('2026-11-19T12:00:00Z');
const MINUTE = 60 * 1000;
const GOOD_TEXT = 'Чудовий майстер, стрижка саме та, що просив, повернусь знову';

function at(minutes: number): Date {
  return new Date(NOW.getTime() + minutes * MINUTE);
}

function state(overrides: Partial<ReviewRevaluation> = {}): ReviewRevaluation {
  return {
    ...openRevaluation({ reviewId: 'rev-1', rating: 2, text: 'Запізнилися на 20 хвилин', at: NOW }),
    ...overrides,
  };
}

function revaluationService() {
  const repository = new InMemoryReviewRevaluationRepository();
  return { repository, service: new ReviewRevaluationService(repository) };
}

describe('review revaluation policy (T-4463)', () => {
  it('validates rating and text, and starts the loop in the right showcase state', () => {
    expect(validateRatingInput(0, 'текст')).toHaveLength(1);
    expect(validateRatingInput(6, 'текст')).toHaveLength(1);
    expect(validateRatingInput(3.5, 'текст')).toHaveLength(1);
    expect(validateRatingInput(4, '   ')).toEqual(['Review text is required']);
    expect(validateRatingInput(4, 'а'.repeat(MAX_REVIEW_TEXT_LENGTH + 1))).toHaveLength(1);

    const low = openRevaluation({ reviewId: 'r-low', rating: 2, text: 'ок', at: NOW });
    expect(low.originalRating).toBe(2);
    expect(low.showcase).toBe('not_requested');

    const high = openRevaluation({ reviewId: 'r-high', rating: 5, text: GOOD_TEXT, at: NOW });
    expect(high.showcase).toBe('pending');
    expect(high.history).toHaveLength(1);
  });

  it('lets the client improve the rating and resets moderation for the new text', () => {
    const opened = state({
      currentRating: 3,
      showcase: 'approved',
      moderatedBy: 'adm',
      moderatedAt: NOW,
    });

    const improved = applyClientRating(opened, {
      rating: 5,
      text: GOOD_TEXT,
      at: at(10),
    });

    expect(improved.currentRating).toBe(5);
    expect(improved.text).toBe(GOOD_TEXT);
    expect(improved.history.map((entry) => entry.source)).toEqual(['initial', 'client']);
    expect(improved.showcase).toBe('pending');
    expect(improved.moderatedBy).toBeUndefined();
  });

  it('refuses to edit a closed loop and reports the summary', () => {
    const closed = closeLoop(state(), 'admin-1', at(30));

    expect(canEditRating(closed).allowed).toBe(false);
    expect(() => applyClientRating(closed, { rating: 5, text: GOOD_TEXT, at: at(40) })).toThrow(
      'closed'
    );
    expect(revaluationSummary(closed)).toMatchObject({
      originalRating: 2,
      currentRating: 2,
      delta: 0,
      promptsSent: 0,
      closed: true,
    });
  });

  it('asks for a re-rating once after an admin reply — not twice in a row for the same low rating', () => {
    const first = recordAdminReply(state(), at(5));
    expect(first.decision.ask).toBe(true);
    expect(first.state.prompts).toEqual([{ at: at(5), rating: 2 }]);

    const second = recordAdminReply(first.state, at(60));
    expect(second.decision.ask).toBe(false);
    expect(second.decision.reason).toContain('not asking twice in a row');
    expect(second.state.prompts).toHaveLength(1);
  });

  it('does not ask when the rating is already high or the loop is closed', () => {
    expect(shouldAskForRevaluation(state({ currentRating: 5 })).ask).toBe(false);
    expect(shouldAskForRevaluation(closeLoop(state(), 'admin-1', at(1)))).toEqual({
      ask: false,
      reason: 'Review loop is closed',
    });
  });

  it('asks again only after the client improved the rating', () => {
    const prompted = recordAdminReply(state(), at(5)).state;
    const improved = applyClientRating(prompted, {
      rating: 4,
      text: 'Проблему вирішили, дякую',
      at: at(20),
    });

    expect(shouldAskForRevaluation(improved).ask).toBe(false);
    expect(improved.currentRating).toBe(4);
  });

  it('shows a record publicly only after moderation of a 4–5★ review with real text', () => {
    const pending = state({ currentRating: 5, text: GOOD_TEXT, showcase: 'pending' });

    expect(publicShowcaseEligibility(pending)).toEqual({
      eligible: false,
      reason: 'Awaiting moderation',
    });

    const approved = moderateShowcase(pending, { moderatorId: 'admin-1', decision: 'approved' });
    expect(publicShowcaseEligibility(approved).eligible).toBe(true);

    const rejected = moderateShowcase(pending, {
      moderatorId: 'admin-1',
      decision: 'rejected',
      note: 'схоже на накрутку',
    });
    expect(publicShowcaseEligibility(rejected).eligible).toBe(false);
    expect(rejected.moderationNote).toBe('схоже на накрутку');
  });

  it('blocks moderation of low ratings and too-short text', () => {
    expect(isShowcaseQualityText('ок')).toBe(false);
    expect(isShowcaseQualityText(GOOD_TEXT)).toBe(true);
    expect(() =>
      moderateShowcase(state({ currentRating: 2 }), {
        moderatorId: 'admin-1',
        decision: 'approved',
      })
    ).toThrow('4–5★');
    expect(() =>
      moderateShowcase(state({ currentRating: 5, text: 'ок' }), {
        moderatorId: 'admin-1',
        decision: 'approved',
      })
    ).toThrow(`at least ${SHOWCASE_MIN_TEXT_LENGTH} characters`);
  });
});

describe('ReviewRevaluationService (T-4463)', () => {
  it('registers a review lazily and persists the client’s improved rating', async () => {
    const { repository, service } = revaluationService();

    const opened = await service.rate('rev-1', { rating: 2, text: 'Запізнилися', at: NOW });
    expect(opened.originalRating).toBe(2);

    const improved = await service.rate('rev-1', { rating: 5, text: GOOD_TEXT, at: at(5) });
    const stored = await repository.find('rev-1');

    expect(improved.currentRating).toBe(5);
    expect(stored?.history).toHaveLength(2);
    expect(await service.summary('rev-1')).toMatchObject({ delta: 3, showcaseState: 'pending' });
  });

  it('sends one prompt per low rating after admin replies and closes the loop', async () => {
    const { service } = revaluationService();
    await service.track({ reviewId: 'rev-1', rating: 1, text: 'Жахливо', at: NOW });

    const first = await service.onAdminReply('rev-1', at(5));
    const second = await service.onAdminReply('rev-1', at(10));

    expect(first.decision.ask).toBe(true);
    expect(second.decision.ask).toBe(false);

    const closed = await service.close('rev-1', 'admin-1', at(15));
    expect(closed.closedBy).toBe('admin-1');
    await expect(service.rate('rev-1', { rating: 5, text: GOOD_TEXT, at: at(20) })).rejects.toThrow(
      'closed'
    );
  });

  it('exposes only moderated 4–5★ reviews on the public showcase', async () => {
    const { service } = revaluationService();
    await service.track({ reviewId: 'rev-low', rating: 2, text: 'Запізнилися', at: NOW });
    await service.track({ reviewId: 'rev-high', rating: 5, text: GOOD_TEXT, at: NOW });

    expect(await service.showcase()).toEqual([]);

    await service.moderate('rev-high', { moderatorId: 'admin-1', decision: 'approved' });

    expect(await service.showcase()).toEqual([
      { reviewId: 'rev-high', rating: 5, text: GOOD_TEXT },
    ]);
  });

  it('rejects operations on untracked reviews', async () => {
    const { service } = revaluationService();
    await expect(service.close('missing', 'admin-1')).rejects.toThrow('not tracked');
    await expect(service.onAdminReply('missing')).rejects.toThrow('not tracked');
  });
});

describe('FeedbackSurfacesController revaluation routes (T-4463)', () => {
  function controller() {
    const { service } = revaluationService();
    return {
      service,
      controller: new FeedbackSurfacesController(
        {} as FeedbackSurfacesService,
        {} as ReviewProcessingService,
        service
      ),
    };
  }

  it('serves the client rating route and the admin summary', async () => {
    const { controller: api } = controller();

    const rated = await api.rateReview('rev-1', { rating: 2, text: 'Запізнилися' });
    expect(rated.data.currentRating).toBe(2);

    const summary = await api.reviewRevaluationSummary('rev-1');
    expect(summary.data).toMatchObject({ originalRating: 2, closed: false });
  });

  it('maps policy failures to 400 and publishes only approved reviews', async () => {
    const { controller: api } = controller();

    await expect(api.closeReviewLoop('missing', { actorId: 'admin-1' })).rejects.toBeInstanceOf(
      BadRequestException
    );

    await api.rateReview('rev-high', { rating: 5, text: GOOD_TEXT });
    await expect(
      api.moderateReviewShowcase('rev-high', {
        moderatorId: 'admin-1',
        decision: 'approved',
      })
    ).resolves.toMatchObject({ success: true });

    const showcase = await api.publicShowcase();
    expect(showcase.data.total).toBe(1);
    expect(showcase.data.reviews[0]?.reviewId).toBe('rev-high');
  });

  it('records an admin reply prompt and closes the loop over HTTP', async () => {
    const { controller: api } = controller();
    await api.rateReview('rev-1', { rating: 1, text: 'Жахливо' });

    const reply = await api.recordRevaluationReply('rev-1');
    expect(reply.data.decision.ask).toBe(true);

    const closed = await api.closeReviewLoop('rev-1', { actorId: 'admin-1' });
    expect(closed.data.closedBy).toBe('admin-1');
  });
});
