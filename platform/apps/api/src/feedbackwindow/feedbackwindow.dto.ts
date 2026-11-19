// Input DTOs для T-150 FeedbackWindow. Типи вікна/подання живуть у домені,
// щоб контролер, сервіс і домен не оголошували їх по-різному.
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import type { FeedbackWindowOutput } from './feedbackwindow.domain';

export type { FeedbackWindowOutput, FeedbackSubmission, PhotoRef } from './feedbackwindow.domain';

// Create FeedbackWindow input DTO
export class CreateFeedbackWindowInput {
  appointmentId!: string;
  clientId!: string;
  locationId!: string;
}

// Submit Feedback input DTO (FDB-001: 1-5 stars, text ≤ 1000, ≤ 3 photos)
export class SubmitFeedbackInput {
  windowId!: string;
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @IsString()
  @Length(0, 1000)
  text!: string;
  @IsOptional()
  photoIds?: string[];
}

export type FeedbackWindowResponse = FeedbackWindowOutput | null;
