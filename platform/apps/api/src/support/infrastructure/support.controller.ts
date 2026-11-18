import { Controller, Get, Post, Body, Param, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/validation/zod-validation.pipe';
import { CreateSupportTicketUseCase, ResolveSupportTicketUseCase, GetInteractiveFaqsUseCase, GetErrorRecoverySuggestionUseCase } from '../application/support.use-cases';
import { InMemorySupportRepository } from '../application/in-memory-support.repository';

const CreateTicketSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(5, 'Phone number is required'),
  category: z.enum(['BOOKING_ISSUE', 'PAYMENT_REFUND', 'SERVICE_FEEDBACK', 'CANCELLATION', 'GENERAL_INQUIRY'] as const),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const ResolveTicketSchema = z.object({
  resolutionNotes: z.string().min(5, 'Resolution notes must be at least 5 characters'),
  staffId: z.string().min(1, 'Staff ID is required'),
});

type CreateTicketDto = z.infer<typeof CreateTicketSchema>;
type ResolveTicketDto = z.infer<typeof ResolveTicketSchema>;

@Controller('support')
export class SupportController {
  private readonly repository = new InMemorySupportRepository();
  private readonly createTicketUseCase = new CreateSupportTicketUseCase(this.repository);
  private readonly resolveTicketUseCase = new ResolveSupportTicketUseCase(this.repository);
  private readonly getFaqsUseCase = new GetInteractiveFaqsUseCase(this.repository);
  private readonly getErrorSuggestionUseCase = new GetErrorRecoverySuggestionUseCase(this.repository);

  @Post('tickets')
  @UsePipes(new ZodValidationPipe(CreateTicketSchema))
  async createTicket(@Body() body: CreateTicketDto) {
    return this.createTicketUseCase.execute(body);
  }

  @Post('tickets/:id/resolve')
  @UsePipes(new ZodValidationPipe(ResolveTicketSchema))
  async resolveTicket(
    @Param('id') id: string,
    @Body() body: ResolveTicketDto,
  ) {
    return this.resolveTicketUseCase.execute({
      ticketId: id,
      resolutionNotes: body.resolutionNotes,
      staffId: body.staffId,
    });
  }

  @Get('faqs')
  async getFaqs() {
    return this.getFaqsUseCase.execute();
  }

  @Get('errors/:code')
  async getErrorRecovery(@Param('code') code: string) {
    return this.getErrorSuggestionUseCase.execute(code);
  }
}
