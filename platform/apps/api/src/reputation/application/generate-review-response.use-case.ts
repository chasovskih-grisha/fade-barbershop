import { Injectable } from '@nestjs/common';
import { ReviewResponseTemplate, ReviewSentimentType } from '../domain/review-response.value-object';

export interface GenerateResponseInput {
  readonly reviewId?: string;
  readonly customerName: string;
  readonly rating: number;
  readonly reviewText: string;
  readonly tone?: 'PROFESSIONAL' | 'WARM' | 'APOLOGETIC' | 'VIP';
  readonly isVip?: boolean;
}

export interface GenerateResponseOutput {
  readonly reviewId?: string;
  readonly customerName: string;
  readonly suggestedResponse: string;
  readonly sentiment: ReviewSentimentType;
  readonly needsEscalation: boolean;
  readonly responseTone: string;
}

@Injectable()
export class GenerateReviewResponseUseCase {
  public execute(input: GenerateResponseInput): GenerateResponseOutput {
    let sentiment: ReviewSentimentType = 'NEUTRAL';
    if (input.rating >= 4) {
      sentiment = 'POSITIVE';
    } else if (input.rating <= 2) {
      sentiment = 'NEGATIVE';
    }

    const baseTemplate = ReviewResponseTemplate.getTemplate(sentiment, input.customerName);
    const tone = input.tone || (sentiment === 'NEGATIVE' ? 'APOLOGETIC' : input.isVip ? 'VIP' : 'WARM');

    let suggestedResponse = baseTemplate;
    if (tone === 'VIP') {
      suggestedResponse = `Hi ${input.customerName}, as one of our valued VIP guests, your feedback means the world to us! Thank you for the wonderful support at FADE. We've noted your favorite cut preferences for your next visit.`;
    } else if (tone === 'PROFESSIONAL') {
      suggestedResponse = `Dear ${input.customerName}, thank you for taking the time to share your review regarding your experience at FADE. We appreciate your feedback and look forward to serving you again.`;
    } else if (tone === 'APOLOGETIC' && sentiment === 'NEGATIVE') {
      suggestedResponse = `Dear ${input.customerName}, we sincerely apologize that your experience at FADE did not meet our high standards. Our manager has been alerted and would love to speak with you directly to resolve this and offer a complimentary service on us.`;
    }

    const needsEscalation = ReviewResponseTemplate.shouldEscalateToAdmin(input.rating, sentiment === 'NEGATIVE' ? -0.8 : 0.0);

    return {
      reviewId: input.reviewId ?? '',
      customerName: input.customerName,
      suggestedResponse,
      sentiment,
      needsEscalation,
      responseTone: tone,
    };
  }
}
