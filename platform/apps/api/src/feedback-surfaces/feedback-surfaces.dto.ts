import { Type, IsOptional, IsString, IsNumber, Length, MaxLength } from '@nestjs/common';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

// Can submit input DTO
export class CanSubmitInput {
  @IdempotencyKey()
  clientId: string;
  @IdempotencyKey()
  appointmentId: string;
}

// Feedback Surfaces Output DTO
export class FeedbackSurfacesOutput {
  success: boolean;
  data: {
    appointmentId: string;
    windowStatus: string;
    daysRemaining: number;
    canSubmit: boolean;
    reason?: string;
  };
}

// My Reviews Output DTO
export class MyReviewsOutput {
  success: boolean;
  data: {
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
  };
}

// Can Submit Output DTO
export class CanSubmitOutput {
  success: boolean;
  data: {
    canSubmit: boolean;
    reason?: string;
    daysRemaining: number;
    windowStatus: string;
  };
}

// Admin List Input DTO
export class AdminListInput {
  @IsOptional()
  page?: number;
  @IsOptional()
  limit?: number;
  @IsOptional()
  status?: string;
  @IsOptional()
  barberId?: string;
  @IsOptional()
  clientId?: string;
  @IsOptional()
  startDate?: string;
  @IsOptional()
  endDate?: string;
}

// Admin List Output DTO
export class AdminListOutput {
  success: boolean;
  data: {
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
  };
}

// Admin Reply Output DTO
export class AdminReplyOutput {
  success: boolean;
  data: {
    id: string;
    reviewId: string;
    adminId: string;
    replyText: string;
    repliedAt: Date;
  };
}