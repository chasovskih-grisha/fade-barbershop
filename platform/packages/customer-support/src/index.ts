export interface SupportTicket {
  id: string;
  customerName: string;
  email: string;
  category: 'booking' | 'billing' | 'onboarding' | 'general';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedResolutionMinutes?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  helpfulCount?: number;
}

export interface ErrorRecoveryFlow {
  errorCode: string;
  title: string;
  userMessage: string;
  suggestedAction: string;
  actionUrl?: string;
}

export class CustomerExperienceManager {
  private faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How do I reschedule or cancel my booking?',
      answer: 'You can reschedule or cancel your booking up to 2 hours before your appointment directly from your confirmation email or client dashboard.',
      category: 'booking',
      tags: ['reschedule', 'cancel', 'appointment'],
      helpfulCount: 42
    },
    {
      id: 'faq-2',
      question: 'What happens if I arrive late?',
      answer: 'We offer a 10-minute grace period. Beyond that, we may need to adjust your service to fit the remaining window to respect our next client.',
      category: 'booking',
      tags: ['late', 'grace period', 'policy'],
      helpfulCount: 38
    },
    {
      id: 'faq-3',
      question: 'How do I join the FADE Loyalty Membership?',
      answer: 'You are automatically enrolled upon your second completed visit, or you can join instantly in your client profile under Membership.',
      category: 'onboarding',
      tags: ['loyalty', 'membership', 'rewards'],
      helpfulCount: 55
    },
    {
      id: 'faq-4',
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and contactless payments securely through our app or in-shop.',
      category: 'billing',
      tags: ['payment', 'apple pay', 'cards'],
      helpfulCount: 29
    }
  ];

  private tickets: SupportTicket[] = [];

  private errorFlows: Map<string, ErrorRecoveryFlow> = new Map([
    ['ERR_BOOKING_SLOT_TAKEN', {
      errorCode: 'ERR_BOOKING_SLOT_TAKEN',
      title: 'Time Slot Just Booked',
      userMessage: 'Another client just claimed this exact barber and time slot.',
      suggestedAction: 'Please select the next available slot or choose another master barber.',
      actionUrl: '/booking/schedule'
    }],
    ['ERR_PAYMENT_DECLINED', {
      errorCode: 'ERR_PAYMENT_DECLINED',
      title: 'Payment Authorization Failed',
      userMessage: 'Your payment card was declined by your bank or payment provider.',
      suggestedAction: 'Verify your card details or try an alternative payment method like Apple Pay.',
      actionUrl: '/checkout/payment'
    }],
    ['ERR_NETWORK_TIMEOUT', {
      errorCode: 'ERR_NETWORK_TIMEOUT',
      title: 'Connection Interrupted',
      userMessage: 'We had trouble reaching our booking servers.',
      suggestedAction: 'Check your internet connection and tap retry to resume your booking.',
      actionUrl: '/booking/retry'
    }]
  ]);

  public getFAQs(category?: string, searchTerm?: string): FAQItem[] {
    let result = this.faqs;
    if (category) {
      result = result.filter(f => f.category === category);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.question.toLowerCase().includes(term) || 
        f.answer.toLowerCase().includes(term) ||
        (f.tags && f.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    return result;
  }

  public markFAQHelpful(id: string): boolean {
    const faq = this.faqs.find(f => f.id === id);
    if (faq) {
      faq.helpfulCount = (faq.helpfulCount || 0) + 1;
      return true;
    }
    return false;
  }

  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>): SupportTicket {
    const category = ticket.category;
    let priority: SupportTicket['priority'] = 'medium';
    let estimatedResolutionMinutes = 120;

    if (category === 'billing') {
      priority = 'high';
      estimatedResolutionMinutes = 30;
    } else if (category === 'booking') {
      priority = 'high';
      estimatedResolutionMinutes = 45;
    } else if (category === 'onboarding') {
      priority = 'low';
      estimatedResolutionMinutes = 240;
    }

    const newTicket: SupportTicket = {
      ...ticket,
      id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'open',
      priority,
      estimatedResolutionMinutes,
      createdAt: new Date().toISOString()
    };
    this.tickets.push(newTicket);
    return newTicket;
  }

  public getTicket(id: string): SupportTicket | undefined {
    return this.tickets.find(t => t.id === id);
  }

  public getErrorRecovery(errorCode: string): ErrorRecoveryFlow {
    const flow = this.errorFlows.get(errorCode);
    if (flow) {
      return flow;
    }
    return {
      errorCode: 'ERR_UNKNOWN',
      title: 'Unexpected Error',
      userMessage: 'Something went wrong while processing your request.',
      suggestedAction: 'Please refresh your page or contact support if the issue persists.',
      actionUrl: '/support'
    };
  }

  public getOnboardingPrompt(step: number): { title: string; guidance: string; actionText: string; progressPercentage: number } {
    switch (step) {
      case 1:
        return {
          title: 'Welcome to FADE',
          guidance: 'Explore our premium grooming services and pick your preferred master barber.',
          actionText: 'Browse Services',
          progressPercentage: 25
        };
      case 2:
        return {
          title: 'Instant Booking & Reminders',
          guidance: 'Select your time slot and get SMS/Email confirmation instantly with calendar sync.',
          actionText: 'Book Appointment',
          progressPercentage: 50
        };
      case 3:
        return {
          title: 'Unlock Loyalty Rewards',
          guidance: 'Earn points on every cut, product purchase, and referral to redeem for free services.',
          actionText: 'View Rewards',
          progressPercentage: 75
        };
      case 4:
        return {
          title: 'You are All Set!',
          guidance: 'Manage your appointments, favorites, and loyalty perks anytime from your client dashboard.',
          actionText: 'Go to Dashboard',
          progressPercentage: 100
        };
      default:
        return {
          title: 'Need Assistance?',
          guidance: 'Our support automation is active 24/7. Ask questions or check our interactive FAQ.',
          actionText: 'Open Support',
          progressPercentage: 100
        };
    }
  }
}
