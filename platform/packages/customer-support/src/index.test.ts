import { CustomerExperienceManager } from '../src';

describe('CustomerExperienceManager', () => {
  let cxManager: CustomerExperienceManager;

  beforeEach(() => {
    cxManager = new CustomerExperienceManager();
  });

  test('should retrieve FAQs and support search', () => {
    const faqs = cxManager.getFAQs();
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs[0].question).toBeDefined();

    const results = cxManager.getFAQs(undefined, 'reschedule');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('faq-1');

    const marked = cxManager.markFAQHelpful('faq-1');
    expect(marked).toBe(true);
  });

  test('should create and retrieve support ticket with priority and estimated resolution', () => {
    const ticket = cxManager.createSupportTicket({
      customerName: 'John Doe',
      email: 'john@example.com',
      category: 'billing',
      message: 'Double charged for my haircut.'
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('high');
    expect(ticket.estimatedResolutionMinutes).toBe(30);

    const retrieved = cxManager.getTicket(ticket.id);
    expect(retrieved).toEqual(ticket);
  });

  test('should retrieve error recovery flows', () => {
    const recovery = cxManager.getErrorRecovery('ERR_BOOKING_SLOT_TAKEN');
    expect(recovery.title).toBe('Time Slot Just Booked');
    expect(recovery.actionUrl).toBeDefined();

    const unknownRecovery = cxManager.getErrorRecovery('UNKNOWN_ERR');
    expect(unknownRecovery.errorCode).toBe('ERR_UNKNOWN');
  });

  test('should provide correct onboarding prompts with progress percentage', () => {
    const prompt1 = cxManager.getOnboardingPrompt(1);
    expect(prompt1.title).toContain('Welcome');
    expect(prompt1.progressPercentage).toBe(25);

    const prompt4 = cxManager.getOnboardingPrompt(4);
    expect(prompt4.title).toContain('All Set');
    expect(prompt4.progressPercentage).toBe(100);
  });
});
