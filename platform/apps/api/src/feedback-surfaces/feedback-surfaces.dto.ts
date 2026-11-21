/* eslint-disable max-lines -- cohesive module (107 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// DTO контрактів T-151 Feedback Surfaces.
// T-4463: повторна оцінка, закриття циклу й модерація вітрини.
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CanSubmitInput {
  @IsString()
  clientId!: string;
  @IsString()
  appointmentId!: string;
}

export class AdminReplyInput {
  @IsString()
  reviewId!: string;
  @IsString()
  adminId!: string;
  @IsString()
  replyText!: string;
}

export class MyReviewsQuery {
  @IsOptional()
  status?: 'all' | 'active' | 'expired';
}

export class AdminListInput {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @IsOptional()
  @IsString()
  status?: string;
  @IsOptional()
  @IsString()
  barberId?: string;
  @IsOptional()
  @IsString()
  clientId?: string;
  @IsOptional()
  startDate?: string;
  @IsOptional()
  endDate?: string;
}

export interface ClientReviewItem {
  id: string;
  appointmentId: string;
  rating: number;
  text: string;
  photosCount: number;
  submittedAt: Date;
  appointmentBarberId?: string;
  appointmentServiceName?: string;
  editable: boolean;
}

export interface BarberReviewItem {
  id: string;
  clientId: string;
  rating: number;
  text: string;
  photosCount: number;
  submittedAt: Date;
}

export interface AdminReviewItem {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  rating: number;
  text: string;
  photosCount: number;
  status: string;
  submittedAt: Date;
  windowEndsAt: Date;
}

// T-4451: опрацювання відгуків.
export class ReviewReplyBody {
  @IsString()
  adminId!: string;
  @IsString()
  text!: string;
}

export class ReviewStatusBody {
  @IsString()
  status!: 'new' | 'processed' | 'archived';
  @IsString()
  actorId!: string;
}

export class RevaluationRateBody {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @IsString()
  text!: string;
}

export class RevaluationCloseBody {
  @IsString()
  actorId!: string;
}

export class ShowcaseModerationBody {
  @IsString()
  moderatorId!: string;
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';
  @IsOptional()
  @IsString()
  note?: string;
}
