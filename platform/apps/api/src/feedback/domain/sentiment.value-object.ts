export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export class Sentiment {
  constructor(
    public readonly rating: number,
    public readonly text?: string
  ) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  get type(): SentimentType {
    if (this.rating >= 4) return 'POSITIVE';
    if (this.rating === 3) return 'NEUTRAL';
    return 'NEGATIVE';
  }

  get isEscalated(): boolean {
    return this.rating <= 2;
  }
}
