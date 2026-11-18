import { Type, IsOptional, IsNumber, IsString, Length, MaxLength } from '@nestjs/common';
import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';

// Create FeedbackWindow input DTO
export class CreateFeedbackWindowInput {
  @IdempotencyKey()
  appointmentId: string;
  @IdempotencyKey()
  clientId: string;
  @IdempotencyKey()
  locationId: string;
}

// Submit Feedback input DTO
export class SubmitFeedbackInput {
  @IdempotencyKey()
  windowId: string;
  @IsNumber()
  rating: number; // 1-5 stars
  @IsString()
  @Length(1, 1000)
  text: string; // ≤ 1000 chars
  @IsOptional()
  @MaxLength(3)
  photoIds: string[]; // ≤ 3 photos
}

// Feedback Photo reference DTO
export class PhotoRef {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

// Feedback Submission DTO
export class FeedbackSubmission {
  id: string;
  rating: number;
  text: string;
  photos: PhotoRef[];
  submittedAt: Date;
}

// Feedback Window Output DTO
export class FeedbackWindowOutput {
  success: boolean;
  data: {
    id: string;
    appointmentId: string;
    clientId: string;
    locationId: string;
    openedAt: Date;
    windowEndsAt: Date;
    status: string;
    submission?: {
      id: string;
      rating: number;
      text: string;
      photos: PhotoRef[];
      submittedAt: Date;
    };
    reminderSent: boolean;
    daysRemaining: number;
  };
}