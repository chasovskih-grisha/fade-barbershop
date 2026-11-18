import { SupportTicketRepository } from './support.repository';
import { SupportTicketEntity, InteractiveFaqEntity, ErrorRecoverySuggestionEntity, SupportTicketCategory, SupportTicketPriority } from '../domain/support.entity';

export class CreateSupportTicketUseCase {
  constructor(private readonly supportRepository: SupportTicketRepository) {}

  async execute(params: {
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    category: SupportTicketCategory;
    priority: SupportTicketPriority;
    subject: string;
    message: string;
  }): Promise<SupportTicketEntity> {
    const ticket: SupportTicketEntity = {
      id: params.id,
      clientId: params.clientId,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      category: params.category,
      priority: params.priority,
      subject: params.subject,
      message: params.message,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.supportRepository.saveTicket(ticket);
    return ticket;
  }
}

export class ResolveSupportTicketUseCase {
  constructor(private readonly supportRepository: SupportTicketRepository) {}

  async execute(params: {
    ticketId: string;
    resolutionNotes: string;
    staffId: string;
  }): Promise<SupportTicketEntity> {
    const ticket = await this.supportRepository.findTicketById(params.ticketId);
    if (!ticket) {
      throw new Error(`Support ticket not found: ${params.ticketId}`);
    }

    ticket.status = 'RESOLVED';
    ticket.resolutionNotes = params.resolutionNotes;
    ticket.assignedStaffId = params.staffId;
    ticket.updatedAt = new Date().toISOString();

    await this.supportRepository.saveTicket(ticket);
    return ticket;
  }
}

export class GetInteractiveFaqsUseCase {
  constructor(private readonly supportRepository: SupportTicketRepository) {}

  async execute(): Promise<InteractiveFaqEntity[]> {
    return this.supportRepository.getInteractiveFaqs();
  }
}

export class GetErrorRecoverySuggestionUseCase {
  constructor(private readonly supportRepository: SupportTicketRepository) {}

  async execute(errorCode: string): Promise<ErrorRecoverySuggestionEntity | null> {
    return this.supportRepository.getErrorRecoverySuggestion(errorCode);
  }
}
