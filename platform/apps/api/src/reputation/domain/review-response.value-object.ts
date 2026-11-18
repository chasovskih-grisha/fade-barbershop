export type ReviewSentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export class ReviewResponseTemplate {
  public static getTemplate(sentiment: ReviewSentimentType, customerName: string): string {
    switch (sentiment) {
      case 'POSITIVE':
        return `Hi ${customerName}, thank you so much for the stellar review! We're thrilled you enjoyed your experience at FADE. See you next time!`;
      case 'NEGATIVE':
        return `Hi ${customerName}, we are sincerely sorry your experience did not meet expectations. We take this very seriously and our manager would love to make it right. Please contact us directly.`;
      case 'NEUTRAL':
      default:
        return `Hi ${customerName}, thank you for visiting FADE and sharing your feedback! We're always striving to improve and hope to deliver a 5-star experience on your next visit.`;
    }
  }

  public static shouldEscalateToAdmin(rating: number, sentimentScore: number): boolean {
    return rating <= 2 || sentimentScore < -0.3;
  }
}
