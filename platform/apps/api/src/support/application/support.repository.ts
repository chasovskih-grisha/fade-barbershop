import {
  SupportTicketEntity,
  InteractiveFaqEntity,
  ErrorRecoverySuggestionEntity,
} from '../domain/support.entity';

export interface SupportTicketRepository {
  saveTicket(ticket: SupportTicketEntity): Promise<void>;
  findTicketById(id: string): Promise<SupportTicketEntity | null>;
  getInteractiveFaqs(): Promise<InteractiveFaqEntity[]>;
  getErrorRecoverySuggestion(errorCode: string): Promise<ErrorRecoverySuggestionEntity | null>;
  saveInteractiveFaq(faq: InteractiveFaqEntity): Promise<void>;
  saveErrorRecoverySuggestion(suggestion: ErrorRecoverySuggestionEntity): Promise<void>;
}
