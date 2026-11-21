import type { AutoReplyRequest, AutoReplyResult } from './types';

type ReplyPriority = AutoReplyResult['priority'];

interface ReplyDraft {
  priority: ReplyPriority;
  requiresEscalationToAdmin: boolean;
  suggestedReply: string;
}

function buildReply(request: AutoReplyRequest, firstName: string): ReplyDraft {
  const { rating, sentiment, service, barber } = request;

  if (sentiment === 'positive' || rating >= 4) {
    return {
      priority: 'low',
      requiresEscalationToAdmin: false,
      suggestedReply: `Hi ${firstName}, thank you for the wonderful 5-star review! We're thrilled you enjoyed your ${service} with ${barber}. See you again soon at FADE!`,
    };
  }

  if (sentiment === 'negative' || rating <= 2) {
    return {
      priority: 'urgent',
      requiresEscalationToAdmin: true,
      suggestedReply: `Dear ${firstName}, we sincerely apologize that your experience with ${barber} didn't meet your expectations. Management has been notified and we would like to invite you back for a complimentary correction. Please contact us directly.`,
    };
  }

  return {
    priority: 'medium',
    requiresEscalationToAdmin: false,
    suggestedReply: `Hi ${firstName}, thank you for your feedback regarding your ${service}. We appreciate your notes and are continuously improving our service quality at FADE.`,
  };
}

/**
 * Generate an automated professional reply and escalation priority based on review characteristics.
 */
export function generateAutoReply(request: AutoReplyRequest): AutoReplyResult {
  const firstName = request.clientName.split(' ')[0] || request.clientName;
  const draft = buildReply(request, firstName);

  return {
    reviewId: request.reviewId,
    suggestedReply: draft.suggestedReply,
    requiresEscalationToAdmin: draft.requiresEscalationToAdmin,
    priority: draft.priority,
  };
}
