import { prisma } from '../../..';
import { Appointment, Booking, ClientProfile } from '../domain';
import { FeedbackWindow, FeedbackSubmission } from '../feedbackwindow/feedbackwindow.domain';

/** T-151: Feedback Surfaces - API endpoints for review surfaces.
 * Cabinets/mobile: "Leave review" button on completed visit within window
 * "My reviews" with deletion
 * Barber: reviews of own visits + own average
 * Admin: list, filters, barber/admin reply
 * Publication — phase 25 gate.
 */
export class FeedbackSurfacesService {
  /** Get all reviews for an appointment (client sees if within window) */
  async getAppointmentReviews(appointmentId: string): Promise<{
    submission?: FeedbackSubmission;
    windowEndsAt: Date;
    daysRemaining: number;
    canStillSubmit: boolean;
  }> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { appointmentId },
      include: { submission: true },
    });

    if (!window) {
      return {
        submission: undefined,
        windowEndsAt: new Date(),
        daysRemaining: 0,
        canStillSubmit: false,
      };
    }

    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((window.windowEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    return {
      submission: window.submission,
      windowEndsAt: window.windowEndsAt,
      daysRemaining,
      canStillSubmit: window.status === 'open' && !window.submission,
    };
  }

  /** Get all reviews submitted by a client (My Reviews) */
  async getClientReviews(clientId: string, status?: 'all' | 'active' | 'expired'): Promise<{
    totalCount: number;
    submissions: Array<{
      id: string;
      appointmentId: string;
      rating: number;
      text: string;
      photosCount: number;
      submittedAt: Date;
      appointmentBarberId?: string;
      appointmentServiceName?: string;
    }>;
  }> {
    const where = {
      clientId,
      ...(status !== 'all' ? { status } : {}),
    };

    const submissions = await prisma.feedbackSubmission.findMany({
      where,
      include: {
        window: {
          include: {
            appointment: {
              include: {
                barber: true,
                service: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      totalCount: submissions.length,
      submissions: submissions.map((s) => ({
        id: s.id,
        appointmentId: s.window.appointmentId,
        rating: s.rating,
        text: s.text,
        photosCount: s.photos?.length ?? 0,
        submittedAt: s.submittedAt,
        appointmentBarberId: s.window.appointment.barberId,
        appointmentServiceName: s.window.appointment.service?.name,
      })),
    };
  }

  /** Get reviews for a barber's own visits */
  async getBarberReviews(barberId: string, clientId?: string): Promise<{
    totalRatings: number;
    averageRating: number;
    totalReviews: number;
    reviews: Array<{
      id: string;
      clientId: string;
      rating: number;
      text: string;
      photosCount: number;
      submittedAt: Date;
    }>;
  }> {
    // Find all feedback windows for appointments where this barber worked
    const windows = await prisma.feedbackWindow.findMany({
      include: {
        submission: true,
        appointment: {
          include: {
            barber: true,
            service: true,
            client: true,
          },
        },
      },
      where: {
        appointment: {
          barberId,
          ...(clientId ? { clientId } : {}),
        },
      },
    });

    const submissions = windows
      .filter((w) => w.submission)
      .map((w) => w.submission!);

    const totalReviews = submissions.length;
    const totalRatings = submissions.reduce((sum, s) => sum + s.rating, 0);
    const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10, // 1 decimal
      totalReviews,
      reviews: submissions.map((s) => ({
        id: s.id,
        clientId: s.window.clientId,
        rating: s.rating,
        text: s.text,
        photosCount: s.photos?.length ?? 0,
        submittedAt: s.submittedAt,
      })),
    };
  }

  /** Admin: list all feedback submissions with filters */
  async adminListFeedback(
    filters: { status?: string; barberId?: string; clientId?: string; startDate?: Date; endDate?: Date },
    pagination: { page: number; limit: number }
  ): Promise<{
    total: number;
    page: number;
    totalPages: number;
    submissions: Array<{
      id: string;
      appointmentId: string;
      clientId: string;
      barberId: string;
      rating: number;
      text: string;
      photosCount: number;
      status: string;
      submittedAt: Date;
      windowEndsAt: Date;
    }>;
  }> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.barberId) {
      where.appointment = { barberId: filters.barberId };
    }
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.startDate || filters.endDate) {
      where.appointment = where.appointment || {};
      if (filters.startDate) where.appointment.startedAt = { gte: filters.startDate };
      if (filters.endDate) where.appointment.startedAt = { lte: filters.endDate };
    }

    const [submissions, total] = await prisma.$executeRaw`
      SELECT fs.*, fw.status as windowStatus, fw.openedAt, fw.windowEndsAt, 
             fb.id as barberId, fb.name as barberName
      FROM FeedbackSubmission fs
      JOIN FeedbackWindow fw ON fs.windowId = fw.id
      JOIN Appointment fb ON fw.appointmentId = fb.id
      WHERE ${JSON.stringify(where)}
      ORDER BY fs.submittedAt DESC
      LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}
    `;

    return {
      total,
      page: pagination.page,
      totalPages: Math.ceil(total / pagination.limit),
      submissions: submissions as any,
    };
  }

  /** Admin: reply to a review */
  async adminReplyToReview(reviewId: string, adminId: string, replyText: string): Promise<{
    id: string;
    reviewId: string;
    adminId: string;
    replyText: string;
    repliedAt: Date;
  }> {
    const reply = await prisma.adminReviewReply.create({
      data: {
        reviewId,
        adminId,
        replyText,
        repliedAt: new Date(),
      },
    });

    return {
      id: reply.id,
      reviewId,
      adminId,
      replyText,
      repliedAt: reply.repliedAt,
    };
  }

  /** Check if client can submit feedback for an appointment */
  async canClientSubmit(clientId: string, appointmentId: string): Promise<{
    canSubmit: boolean;
    reason?: string;
    daysRemaining: number;
    windowStatus: string;
  }> {
    const window = await prisma.feedbackWindow.findUnique({
      where: { appointmentId },
    });

    if (!window) {
      return {
        canSubmit: false,
        reason: 'Feedback window not found for this appointment',
        daysRemaining: 0,
        windowStatus: 'closed',
      };
    }

    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((window.windowEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    if (window.status !== 'open') {
      return {
        canSubmit: false,
        reason: `Feedback window is ${window.status}`,
        daysRemaining,
        windowStatus: window.status,
      };
    }

    if (window.submission) {
      return {
        canSubmit: false,
        reason: 'Feedback already submitted for this appointment',
        daysRemaining,
        windowStatus: window.status,
      };
    }

    // Check if within 30-day window
    if (now > window.windowEndsAt) {
      // Mark as expired
      await prisma.feedbackWindow.update({
        where: { id: window.id },
        data: { status: 'expired' },
      });
      return {
        canSubmit: false,
        reason: 'Feedback window has expired',
        daysRemaining: 0,
        windowStatus: 'expired',
      };
    }

    return {
      canSubmit: true,
      reason: 'Within feedback window',
      daysRemaining,
      windowStatus: 'open',
    };
  }
}