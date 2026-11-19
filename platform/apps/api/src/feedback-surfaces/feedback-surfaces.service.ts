import { prisma } from '../index';
import type {
  AdminReviewItem,
  BarberReviewItem,
  ClientReviewItem,
} from './feedback-surfaces.dto';
import {
  averageRating,
  daysRemainingUntil,
  evaluateSubmission,
  validateFeedbackSubmission,
} from './feedback-surfaces.policy';

/**
 * T-151: Feedback Surfaces.
 * Читання відгуків для кабінету/мобільного («Мої відгуки»), майстра та адміна.
 * Правила вікна — у feedback-surfaces.policy, тут лише вибірки та збереження.
 * Відгуки приватні в першому релізі (FDB-006).
 */

interface SubmissionRow {
  id: string;
  rating: number;
  text: string;
  submittedAt: Date;
  photos?: Array<{ id: string }> | null;
  window: {
    appointmentId: string;
    clientId: string;
    windowEndsAt: Date;
    status: string;
    appointment?: {
      barberId?: string | null;
      service?: { name?: string | null } | null;
    } | null;
  } | null;
}

export interface AppointmentReviews {
  submission?: {
    id: string;
    rating: number;
    text: string;
    photos: Array<{ id: string; url?: string; sortOrder?: number }>;
    submittedAt: Date;
  };
  windowEndsAt: Date | null;
  daysRemaining: number;
  canStillSubmit: boolean;
  canEdit: boolean;
}

export class FeedbackSurfacesService {
  /** Стан вікна для конкретного візиту (кабінет «Залишити відгук»). */
  async getAppointmentReviews(appointmentId: string): Promise<AppointmentReviews> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { appointmentId },
      include: { submission: true },
    });

    if (!window) {
      return {
        windowEndsAt: null,
        daysRemaining: 0,
        canStillSubmit: false,
        canEdit: false,
      };
    }

    const decision = evaluateSubmission({
      status: window.status,
      openedAt: window.openedAt,
      windowEndsAt: window.windowEndsAt,
      hasSubmission: Boolean(window.submission),
    });

    const result: AppointmentReviews = {
      windowEndsAt: window.windowEndsAt,
      daysRemaining: decision.daysRemaining,
      canStillSubmit: decision.canSubmit,
      canEdit: decision.canEdit,
    };
    if (window.submission) result.submission = window.submission;
    return result;
  }

  /** «Мої відгуки» клієнта з позначкою, чи ще можна редагувати. */
  async getClientReviews(
    clientId: string,
    status: 'all' | 'active' | 'expired' = 'all'
  ): Promise<{ totalCount: number; submissions: ClientReviewItem[] }> {
    const rows = (await prisma.feedbackSubmission.findMany({
      where: {
        window: { clientId, ...(status === 'active' ? { status: 'open' } : {}) },
        ...(status === 'expired' ? { window: { clientId, status: 'expired' } } : {}),
      },
      include: { window: { include: { appointment: { include: { service: true } } } } },
      orderBy: { submittedAt: 'desc' },
    })) as SubmissionRow[];

    const now = new Date();
    const submissions = rows
      .filter((row) => row.window)
      .map((row) => {
        const window = row.window!;
        const decision = evaluateSubmission(
          { status: window.status, windowEndsAt: window.windowEndsAt, hasSubmission: true },
          now
        );
        const item: ClientReviewItem = {
          id: row.id,
          appointmentId: window.appointmentId,
          rating: row.rating,
          text: row.text,
          photosCount: row.photos?.length ?? 0,
          submittedAt: row.submittedAt,
          editable: decision.canEdit,
        };
        const barberId = window.appointment?.barberId;
        if (barberId) item.appointmentBarberId = barberId;
        const serviceName = window.appointment?.service?.name;
        if (serviceName) item.appointmentServiceName = serviceName;
        return item;
      });

    return { totalCount: submissions.length, submissions };
  }

  /** Відгуки по візитах майстра + його середня оцінка (кабінет майстра). */
  async getBarberReviews(
    barberId: string,
    clientId?: string
  ): Promise<{
    totalRatings: number;
    averageRating: number;
    totalReviews: number;
    reviews: BarberReviewItem[];
  }> {
    const windows = await prisma.feedbackWindow.findMany({
      where: {
        submission: { isNot: null },
        appointment: { barberId, ...(clientId ? { clientId } : {}) },
      },
      include: { submission: true },
      orderBy: { openedAt: 'desc' },
    });

    const rows = (windows as Array<{ clientId: string; submission: SubmissionRow | null }>).filter(
      (w) => w.submission
    );

    const reviews: BarberReviewItem[] = rows.map((w) => ({
      id: w.submission!.id,
      clientId: w.clientId,
      rating: w.submission!.rating,
      text: w.submission!.text,
      photosCount: w.submission!.photos?.length ?? 0,
      submittedAt: w.submission!.submittedAt,
    }));

    const ratings = reviews.map((review) => review.rating);
    return {
      totalRatings: ratings.reduce((sum, value) => sum + value, 0),
      averageRating: averageRating(ratings),
      totalReviews: reviews.length,
      reviews,
    };
  }

  /** Адмін: список відгуків з фільтрами та пагінацією. */
  async adminListFeedback(
    filters: {
      status?: string;
      barberId?: string;
      clientId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: { page: number; limit: number }
  ): Promise<{
    total: number;
    page: number;
    totalPages: number;
    submissions: AdminReviewItem[];
  }> {
    const windowFilter: Record<string, unknown> = {};
    if (filters.status) windowFilter.status = filters.status;
    if (filters.clientId) windowFilter.clientId = filters.clientId;

    const where: Record<string, unknown> = {};
    if (Object.keys(windowFilter).length > 0) where.window = windowFilter;
    if (filters.barberId) {
      where.window = { ...windowFilter, appointment: { barberId: filters.barberId } };
    }
    if (filters.startDate || filters.endDate) {
      const submittedAt: Record<string, Date> = {};
      if (filters.startDate) submittedAt.gte = filters.startDate;
      if (filters.endDate) submittedAt.lte = filters.endDate;
      where.submittedAt = submittedAt;
    }

    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));

    const [rows, total] = await Promise.all([
      prisma.feedbackSubmission.findMany({
        where,
        include: { window: { include: { appointment: true } } },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<SubmissionRow[]>,
      prisma.feedbackSubmission.count({ where }) as Promise<number>,
    ]);

    const submissions: AdminReviewItem[] = rows
      .filter((row) => row.window)
      .map((row) => ({
        id: row.id,
        appointmentId: row.window!.appointmentId,
        clientId: row.window!.clientId,
        barberId: row.window!.appointment?.barberId ?? null,
        rating: row.rating,
        text: row.text,
        photosCount: row.photos?.length ?? 0,
        status: row.window!.status,
        submittedAt: row.submittedAt,
        windowEndsAt: row.window!.windowEndsAt,
      }));

    return {
      total,
      page,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      submissions,
    };
  }

  /** Адмін: відповідь на відгук (FDB-ADM-03). */
  async adminReplyToReview(
    reviewId: string,
    adminId: string,
    replyText: string
  ): Promise<{ id: string; reviewId: string; adminId: string; replyText: string; repliedAt: Date }> {
    const reply = await prisma.adminReviewReply.create({
      data: { reviewId, adminId, replyText, repliedAt: new Date() },
    });

    return {
      id: reply.id,
      reviewId,
      adminId,
      replyText,
      repliedAt: reply.repliedAt,
    };
  }

  /** Чи може клієнт подати відгук; прострочене вікно позначається як expired. */
  async canClientSubmit(
    clientId: string,
    appointmentId: string
  ): Promise<{
    canSubmit: boolean;
    canEdit: boolean;
    reason: string;
    daysRemaining: number;
    windowStatus: string;
  }> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { appointmentId },
      include: { submission: true },
    });

    if (!window) {
      return {
        canSubmit: false,
        canEdit: false,
        reason: 'Feedback window not found for this appointment',
        daysRemaining: 0,
        windowStatus: 'closed',
      };
    }

    if (clientId && window.clientId !== clientId) {
      return {
        canSubmit: false,
        canEdit: false,
        reason: 'This visit belongs to another client',
        daysRemaining: 0,
        windowStatus: window.status,
      };
    }

    const decision = evaluateSubmission({
      status: window.status,
      openedAt: window.openedAt,
      windowEndsAt: window.windowEndsAt,
      hasSubmission: Boolean(window.submission),
    });

    if (decision.windowStatus === 'expired' && window.status !== 'expired') {
      await prisma.feedbackWindow.update({
        where: { id: window.id },
        data: { status: 'expired' },
      });
    }

    return {
      canSubmit: decision.canSubmit,
      canEdit: decision.canEdit,
      reason: decision.reason,
      daysRemaining: decision.daysRemaining,
      windowStatus: decision.windowStatus,
    };
  }

  /** Валідація перед збереженням відгуку (FDB-001). */
  validateSubmission(rating: number, text: string, photoCount: number): string[] {
    return validateFeedbackSubmission({ rating, text, photoCount });
  }

  /** Днів до кінця вікна — для віджетів. */
  daysRemaining(windowEndsAt: Date): number {
    return daysRemainingUntil(windowEndsAt);
  }
}
