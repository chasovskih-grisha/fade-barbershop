export type SupportTicketCategory = 'BOOKING_ISSUE' | 'PAYMENT_REFUND' | 'SERVICE_FEEDBACK' | 'CANCELLATION' | 'GENERAL_INQUIRY';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SupportTicketStatus = 'OPEN' | 'ASSIGNED' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface SupportTicketEntity {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  assignedStaffId?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteractiveFaqEntity {
  id: string;
  questionUk: string;
  questionEn: string;
  answerUk: string;
  answerEn: string;
  category: string;
  viewCount: number;
  helpfulCount: number;
  unhelpfulCount: number;
}

export interface ErrorRecoverySuggestionEntity {
  errorCode: string;
  titleUk: string;
  titleEn: string;
  suggestedActionUk: string;
  suggestedActionEn: string;
  autoRecoveryAction?: string;
}
