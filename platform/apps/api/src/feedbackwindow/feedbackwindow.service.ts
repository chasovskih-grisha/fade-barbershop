import { prisma } from '../index';
import { FeedbackWindow, FeedbackWindowStatus, FeedbackSubmission, PhotoRef, CreateFeedbackWindowInput, FeedbackWindowOutput } from './feedbackwindow.domain';
import { Appointment, Booking } from '../domain';
import { push } from '../../../../lib/notifications';

/** T-150: Feedback Window - 30-day window after AppointmentCompleted.
 * Subscription on AppointmentCompleted (idempotent via processed journal - ADR 0016).
 * Window: 30 days from appointment completion.
 * Statuses: open → submitted → expired/closed.
 * Submission: rating 1-5 stars, text ≤ 1000 chars, ≤ 3 photos.
 * Resubmission edits: FDB-002 (one edit allowed within window).
 * Reminder: after exactly 2h if not submitted (FDB-MOB-02).
 * Review deletion: until end of window (FDB-003).
 * Private in first release: FDB-006 accepted; publication — phase 25.
 */
export class FeedbackWindowService {
  /** Subscribe to AppointmentCompleted and create FeedbackWindow.
   * Idempotent: checks processed appointmentId before creating window (ADR 0016).
   * Called by outbox processor after appointment is marked COMPLETED.
   */
  async createFeedbackWindowIfNeeded(
    appointmentId: string,
    clientId: string,
    locationId: string
  ): Promise<{ created: boolean; window: FeedbackWindowOutput | null }> {
    // 1. Idempotency check: has a FeedbackWindow already been created for this appointment?
    const existingWindow = await prisma.feedbackWindow.findFirst({
      where: { appointmentId },
    });

    if (existingWindow) {
      return {
        created: false,
        window: this.mapToOutput(existingWindow),
      };
    }

    // 2. Calculate window boundaries
    const now = new Date();
    const openedAt = now;
    const windowEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // 3. Create FeedbackWindow
    const window = await prisma.feedbackWindow.create({
      data: {
        appointmentId,
        clientId,
        locationId,
        status: FeedbackWindowStatus.OPEN,
        openedAt,
        windowEndsAt,
        reminderSent: false,
      },
    });

    return {
      created: true,
      window: this.mapToOutput(window),
    };
  }

  /** Submit feedback within the 30-day window.
   * Idempotent: one submission per window; one edit allowed (FDB-002).
   * Rating: 1-5 stars required.
   * Text: ≤ 1000 chars.
   * Photos: ≤ 3 photos.
   */
  async submitFeedback(
    windowId: string,
    rating: number,
    text: string,
    photoIds: string[] = []
  ): Promise<FeedbackSubmission> {
    // Validation
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5 stars');
    }
    if (text.length > 1000) {
      throw new Error('Text must be ≤ 1000 characters');
    }
    if (photoIds.length > 3) {
      throw new Error('Maximum 3 photos allowed');
    }

    // 1. Find the window
    const window = await prisma.feedbackWindow.findUnique({
      where: { id: windowId },
    });

    if (!window || window.status !== FeedbackWindowStatus.OPEN) {
      throw new Error('Feedback window is not open for submissions');
    }

    // 2. Check if already submitted (FDB-002: one edit allowed)
    if (window.submission) {
      // Allow edit: update existing submission
      const updated = await prisma.feedbackSubmission.update({
        where: { id: window.submission.id },
        data: { rating, text, photos: photoIds.map(id => ({ id, sortOrder: photoIds.indexOf(id) })), updatedAt: new Date() },
      });
      return updated;
    }

    // 3. Create new submission
    const submission = await prisma.feedbackSubmission.create({
      data: {
        windowId,
        rating,
        text,
        photos: photoIds.map(id => ({
          id, // external ID or generated
          sortOrder: photoIds.indexOf(id),
        })),
      },
    });

    // 4. Mark window as submitted
    await prisma.feedbackWindow.update({
      where: { id: windowId },
      data: { status: FeedbackWindowStatus.SUBMITTED, submissionId: submission.id },
    });

    return submission;
  }

  /** Send reminder after exactly 2 hours if feedback not yet submitted (FDB-MOB-02).
   * Exactly one reminder allowed.
   */
  async sendReminderIfNeeded(windowId: string): Promise<{ reminded: boolean; reminderSentAt: Date | null }> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { id: windowId },
      include: { submission: true },
    });

    if (!window) {
      return { reminded: false, reminderSentAt: null };
    }

    // Check if reminder already sent
    if (window.reminderSent) {
      return { reminded: false, reminderSentAt: window.reminderSentAt };
    }

    // Check if 2 hours have passed since window opened
    const now = new Date();
    const hoursSinceOpen = (now.getTime() - window.openedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceOpen >= 2 && window.status === FeedbackWindowStatus.OPEN && !window.submission) {
      // Send push reminder to client
      try {
        await push.send({
          title: 'Share your experience',
          body: 'We would love to hear about your visit! Please leave feedback.',
          data: {
            type: 'feedback_reminder',
            windowId,
            clientId: window.clientId,
          },
        });
      } catch (error) {
        console.error('Failed to send feedback reminder:', error);
      }

      // Mark reminder as sent
      await prisma.feedbackWindow.update({
        where: { id: windowId },
        data: { reminderSent: true, reminderSentAt: now },
      });

      return { reminded: true, reminderSentAt: now };
    }

    return { reminded: false, reminderSentAt: window.reminderSentAt };
  }

  /** Close the feedback window (until next release phase 25). */
  async closeWindow(windowId: string): Promise<FeedbackWindowOutput> {
    const window = await prisma.feedbackWindow.update({
      where: { id: windowId },
      data: { status: FeedbackWindowStatus.CLOSED },
    });

    return this.mapToOutput(window);
  }

  /** Get feedback window for appointment */
  async getWindowForAppointment(appointmentId: string): Promise<FeedbackWindowOutput | null> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { appointmentId },
      include: { submission: true },
    });

    if (!window) return null;
    return this.mapToOutput(window);
  }

  private mapToOutput(window: any): FeedbackWindowOutput {
    const daysRemaining = Math.max(
      0,
      Math.ceil((window.windowEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );

    return {
      id: window.id,
      appointmentId: window.appointmentId,
      clientId: window.clientId,
      locationId: window.locationId,
      openedAt: window.openedAt,
      windowEndsAt: window.windowEndsAt,
      status: window.status,
      submission: window.submission
        ? {
            id: window.submission.id,
            rating: window.submission.rating,
            text: window.submission.text,
            photos: window.submission.photos,
            submittedAt: window.submission.submittedAt,
          }
        : undefined,
      reminderSent: window.reminderSent,
      daysRemaining,
    };
  }
}