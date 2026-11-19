// Специфікація T-151: правила вікна відгуків і агрегації оцінок.
import {
  averageRating,
  daysRemainingUntil,
  evaluateSubmission,
  isReminderDue,
  validateFeedbackSubmission,
  windowEndsAt,
} from './feedback-surfaces.policy';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

describe('feedback window policy', () => {
  it('counts whole days left and never goes negative', () => {
    expect(daysRemainingUntil(inDays(29.2), NOW)).toBe(30);
    expect(daysRemainingUntil(inDays(0.5), NOW)).toBe(1);
    expect(daysRemainingUntil(inDays(-3), NOW)).toBe(0);
  });

  it('opens a 30-day window for a completed visit', () => {
    const endsAt = windowEndsAt(NOW);
    expect(endsAt.getTime() - NOW.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('allows submission while the window is open and empty', () => {
    const decision = evaluateSubmission(
      { status: 'open', windowEndsAt: inDays(12), hasSubmission: false },
      NOW
    );
    expect(decision).toEqual({
      canSubmit: true,
      canEdit: false,
      reason: 'Within feedback window',
      windowStatus: 'open',
      daysRemaining: 12,
    });
  });

  it('turns open into expired once the deadline passes', () => {
    const decision = evaluateSubmission(
      { status: 'open', windowEndsAt: new Date(NOW.getTime() - 1), hasSubmission: false },
      NOW
    );
    expect(decision.canSubmit).toBe(false);
    expect(decision.windowStatus).toBe('expired');
    expect(decision.daysRemaining).toBe(0);
  });

  it('lets a submitted review be edited, but not submitted twice, inside the window', () => {
    const decision = evaluateSubmission(
      { status: 'submitted', windowEndsAt: inDays(5), hasSubmission: true },
      NOW
    );
    expect(decision.canSubmit).toBe(false);
    expect(decision.canEdit).toBe(true);
    expect(decision.windowStatus).toBe('submitted');
  });

  it('stops edits after the window closes', () => {
    expect(
      evaluateSubmission({ status: 'submitted', windowEndsAt: inDays(-1), hasSubmission: true }, NOW)
        .canEdit
    ).toBe(false);
    expect(
      evaluateSubmission({ status: 'closed', windowEndsAt: inDays(10), hasSubmission: false }, NOW)
        .windowStatus
    ).toBe('closed');
  });

  it('rejects drafts outside the FDB-001 limits', () => {
    expect(validateFeedbackSubmission({ rating: 5, text: 'ok', photoCount: 3 })).toEqual([]);
    expect(validateFeedbackSubmission({ rating: 0, text: 'ok' })).toHaveLength(1);
    expect(validateFeedbackSubmission({ rating: 4.5, text: 'ok' })).toHaveLength(1);
    expect(validateFeedbackSubmission({ rating: 5, text: 'x'.repeat(1001) })).toHaveLength(1);
    expect(validateFeedbackSubmission({ rating: 5, text: 'ok', photoCount: 4 })).toHaveLength(1);
  });

  it('averages ratings to one decimal place', () => {
    expect(averageRating([])).toBe(0);
    expect(averageRating([5])).toBe(5);
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });

  it('sends the reminder exactly once, two hours after opening, only while open', () => {
    const base = {
      status: 'open',
      openedAt: new Date(NOW.getTime() - 3 * 60 * 60 * 1000),
      windowEndsAt: inDays(20),
      hasSubmission: false,
    };
    expect(isReminderDue({ ...base }, NOW)).toBe(true);
    expect(isReminderDue({ ...base, reminderSent: true }, NOW)).toBe(false);
    expect(isReminderDue({ ...base, hasSubmission: true }, NOW)).toBe(false);
    expect(
      isReminderDue({ ...base, openedAt: new Date(NOW.getTime() - 60 * 60 * 1000) }, NOW)
    ).toBe(false);
    expect(isReminderDue({ ...base, status: 'closed' }, NOW)).toBe(false);
  });
});
