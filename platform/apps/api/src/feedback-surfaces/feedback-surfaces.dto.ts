// DTO контрактів T-151 Feedback Surfaces.
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
