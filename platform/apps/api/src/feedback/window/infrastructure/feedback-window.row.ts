// Мапінг рядка Prisma у запис вікна відгуку (T-150).
import type { FeedbackWindowRecord, FeedbackWindowStatus } from '../domain/feedback-window';

export type Row = {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  locationId: string | null;
  completedAt: Date;
  windowEndsAt: Date;
  status: string;
  remindedAt: Date | null;
  submittedAt: Date | null;
  rating: number | null;
  text: string | null;
  photos: unknown;
};

export const toRecord = (row: Row): FeedbackWindowRecord => ({
  id: row.id,
  appointmentId: row.appointmentId,
  clientId: row.clientId,
  barberId: row.barberId,
  locationId: row.locationId,
  completedAt: row.completedAt,
  windowEndsAt: row.windowEndsAt,
  status: row.status as FeedbackWindowStatus,
  remindedAt: row.remindedAt,
  submittedAt: row.submittedAt,
  rating: row.rating,
  text: row.text,
  photos: row.photos,
});
