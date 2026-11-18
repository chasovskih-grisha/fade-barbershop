import { Sentiment, SentimentType } from './sentiment.value-object';
import { FeedbackWindow } from './feedback-window.value-object';

export interface FeedbackProps {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  locationId: string;
  rating: number;
  text?: string;
  photos?: string[];
  isPublic?: boolean;
  consentGiven?: boolean;
  completedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Feedback {
  public readonly id: string;
  public readonly appointmentId: string;
  public readonly clientId: string;
  public readonly barberId: string;
  public readonly locationId: string;
  public readonly sentiment: Sentiment;
  public readonly text: string | undefined;
  public readonly photos: string[];
  public readonly isPublic: boolean;
  public readonly consentGiven: boolean;
  public readonly feedbackWindow: FeedbackWindow;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: FeedbackProps) {
    if (props.text && props.text.length > 1000) {
      throw new Error('Feedback text cannot exceed 1000 characters');
    }
    if (props.photos && props.photos.length > 3) {
      throw new Error('Maximum 3 photos allowed per feedback');
    }

    this.id = props.id;
    this.appointmentId = props.appointmentId;
    this.clientId = props.clientId;
    this.barberId = props.barberId;
    this.locationId = props.locationId;
    this.sentiment = new Sentiment(props.rating, props.text);
    this.text = props.text ?? '';
    this.photos = props.photos || [];
    this.isPublic = props.isPublic || false;
    this.consentGiven = props.consentGiven || false;
    this.feedbackWindow = new FeedbackWindow(props.completedAt);
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  get rating(): number {
    return this.sentiment.rating;
  }

  get sentimentType(): SentimentType {
    return this.sentiment.type;
  }

  get isEscalated(): boolean {
    return this.sentiment.isEscalated;
  }

  canBeSubmitted(now: Date = new Date()): boolean {
    return this.feedbackWindow.isOpen(now);
  }
}
