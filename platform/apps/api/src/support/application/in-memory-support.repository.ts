import { SupportTicketRepository } from './support.repository';
import {
  SupportTicketEntity,
  InteractiveFaqEntity,
  ErrorRecoverySuggestionEntity,
} from '../domain/support.entity';

export class InMemorySupportRepository implements SupportTicketRepository {
  private readonly tickets = new Map<string, SupportTicketEntity>();
  private readonly faqs: InteractiveFaqEntity[] = [
    {
      id: 'FAQ-01',
      questionUk: 'Як перенести або скасувати запис?',
      questionEn: 'How do I reschedule or cancel my booking?',
      answerUk:
        'Ви можете безкоштовно перенести або скасувати запис не пізніше ніж за 3 години до початку через мобільний додаток або кабінет клієнта.',
      answerEn:
        'You can reschedule or cancel your booking for free up to 3 hours before start time via the mobile app or client portal.',
      category: 'BOOKING_ISSUE',
      viewCount: 1420,
      helpfulCount: 1310,
      unhelpfulCount: 24,
    },
    {
      id: 'FAQ-02',
      questionUk: 'Що робити, якщо сталася помилка оплати?',
      questionEn: 'What should I do if a payment error occurs?',
      answerUk:
        'Якщо кошти списалися, а бронювання не підтвердилося, наша система автоматично повертає кошти протягом 15 хвилин або зверніться до підтримки.',
      answerEn:
        'If funds were deducted but booking not confirmed, our system automatically refunds within 15 minutes or contact support.',
      category: 'PAYMENT_REFUND',
      viewCount: 890,
      helpfulCount: 840,
      unhelpfulCount: 12,
    },
  ];

  private readonly errorSuggestions: ErrorRecoverySuggestionEntity[] = [
    {
      errorCode: 'SLOT_LOCKED',
      titleUk: 'Обраний час щойно зайнято',
      titleEn: 'Selected time slot was just locked',
      suggestedActionUk: 'Будь ласка, оберіть сусідній вільний час або оновіть розклад.',
      suggestedActionEn: 'Please choose an adjacent available time slot or refresh the schedule.',
      autoRecoveryAction: 'REFRESH_SLOTS',
    },
    {
      errorCode: 'PAYMENT_DECLINED',
      titleUk: 'Картку відхилено банком',
      titleEn: 'Card declined by issuing bank',
      suggestedActionUk:
        'Перевірте реквізити або скористайтеся іншою платіжною карткою чи Apple Pay / Google Pay.',
      suggestedActionEn:
        'Check card details or use another payment card, Apple Pay, or Google Pay.',
      autoRecoveryAction: 'RETRY_PAYMENT',
    },
  ];

  async saveTicket(ticket: SupportTicketEntity): Promise<void> {
    this.tickets.set(ticket.id, { ...ticket });
  }

  async findTicketById(id: string): Promise<SupportTicketEntity | null> {
    const ticket = this.tickets.get(id);
    return ticket ? { ...ticket } : null;
  }

  async getInteractiveFaqs(): Promise<InteractiveFaqEntity[]> {
    return this.faqs.map((f) => ({ ...f }));
  }

  async getErrorRecoverySuggestion(
    errorCode: string
  ): Promise<ErrorRecoverySuggestionEntity | null> {
    const suggestion = this.errorSuggestions.find((e) => e.errorCode === errorCode);
    return suggestion ? { ...suggestion } : null;
  }

  async saveInteractiveFaq(faq: InteractiveFaqEntity): Promise<void> {
    const idx = this.faqs.findIndex((f) => f.id === faq.id);
    if (idx >= 0) {
      this.faqs[idx] = { ...faq };
    } else {
      this.faqs.push({ ...faq });
    }
  }

  async saveErrorRecoverySuggestion(suggestion: ErrorRecoverySuggestionEntity): Promise<void> {
    const idx = this.errorSuggestions.findIndex((e) => e.errorCode === suggestion.errorCode);
    if (idx >= 0) {
      this.errorSuggestions[idx] = { ...suggestion };
    } else {
      this.errorSuggestions.push({ ...suggestion });
    }
  }
}
