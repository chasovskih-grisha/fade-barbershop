import { prisma } from '../../..';
import { Appointment, Booking, ClientProfile } from '../domain';

/** FeedbackWindow Status */
export enum FeedbackWindowStatus {
  OPEN = 'open',
  SUBMITTED = 'submitted',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

/** Feedback Submission - client submitted feedback */
export interface FeedbackSubmission {
  id: string;
  appointmentId: string;
  clientId: string;
  rating: number; // 1-5 stars
  text: string; // ≤ 1000 chars
  photos: PhotoRef[];
  submittedAt: Date;
  status: FeedbackWindowStatus;
}

/** Photo reference for feedback */
export interface PhotoRef {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

/** FeedbackWindow - 30-day window after appointment */
export interface FeedbackWindow {
  id: string;
  appointmentId: string;
  clientId: string;
  locationId: string;
  openedAt: Date;
  windowEndsAt: Date; // 30 days from openedAt
  status: FeedbackWindowStatus;
  submission?: FeedbackSubmission;
  reminderSent: boolean; // FDB-MOB-02: exactly one reminder after 2h
}

/** Create FeedbackWindow */
export interface CreateFeedbackWindowInput {
  appointmentId: string;
  clientId: string;
  locationId: string;
}

/** FeedbackWindow Output */
export interface FeedbackWindowOutput {
  id: string;
  appointmentId: string;
  clientId: string;
  locationId: string;
  openedAt: Date;
  windowEndsAt: Date;
  status: FeedbackWindowStatus;
  submission?: {
    id: string;
    rating: number;
    text: string;
    photos: PhotoRef[];
    submittedAt: Date;
  };
  reminderSent: boolean;
  daysRemaining: number;
}