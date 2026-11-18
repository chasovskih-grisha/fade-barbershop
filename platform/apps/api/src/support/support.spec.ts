import { InMemorySupportRepository } from './application/in-memory-support.repository';
import {
  CreateSupportTicketUseCase,
  ResolveSupportTicketUseCase,
  GetInteractiveFaqsUseCase,
  GetErrorRecoverySuggestionUseCase,
} from './application/support.use-cases';

describe('Customer Experience & Support Automation Specialist', () => {
  let repository: InMemorySupportRepository;
  let createTicket: CreateSupportTicketUseCase;
  let resolveTicket: ResolveSupportTicketUseCase;
  let getFaqs: GetInteractiveFaqsUseCase;
  let getErrorSuggestion: GetErrorRecoverySuggestionUseCase;

  beforeEach(() => {
    repository = new InMemorySupportRepository();
    createTicket = new CreateSupportTicketUseCase(repository);
    resolveTicket = new ResolveSupportTicketUseCase(repository);
    getFaqs = new GetInteractiveFaqsUseCase(repository);
    getErrorSuggestion = new GetErrorRecoverySuggestionUseCase(repository);
  });

  it('should create and resolve support tickets with priority and category', async () => {
    const ticket = await createTicket.execute({
      id: 'TICK-100',
      clientId: 'CUST-1',
      clientName: 'Олександр Коваленко',
      clientEmail: 'oleksandr@example.com',
      clientPhone: '+380501112233',
      category: 'BOOKING_ISSUE',
      priority: 'HIGH',
      subject: 'Не можу обрати час запису на суботу',
      message: 'Слот показує зайнятим, хоча впевнений, що він вільний.',
    });

    expect(ticket.id).toBe('TICK-100');
    expect(ticket.status).toBe('OPEN');

    const resolved = await resolveTicket.execute({
      ticketId: 'TICK-100',
      resolutionNotes: 'Перевірили кеш розкладу, слот розблоковано та заброньовано адміністратором.',
      staffId: 'STAFF-9',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionNotes).toContain('розблоковано');
    expect(resolved.assignedStaffId).toBe('STAFF-9');
  });

  it('should provide interactive FAQs in Ukrainian and English', async () => {
    const faqs = await getFaqs.execute();
    expect(faqs.length).toBeGreaterThanOrEqual(2);
    const firstFaq = faqs[0];
    expect(firstFaq).toBeDefined();
    if (firstFaq) {
      expect(firstFaq.questionUk).toBeDefined();
      expect(firstFaq.questionEn).toBeDefined();
      expect(firstFaq.category).toBe('BOOKING_ISSUE');
    }
  });

  it('should provide error recovery suggestions and auto-actions for known error codes', async () => {
    const suggestion = await getErrorSuggestion.execute('SLOT_LOCKED');
    expect(suggestion).not.toBeNull();
    expect(suggestion?.errorCode).toBe('SLOT_LOCKED');
    expect(suggestion?.autoRecoveryAction).toBe('REFRESH_SLOTS');
    expect(suggestion?.titleUk).toBeDefined();
  });
});
