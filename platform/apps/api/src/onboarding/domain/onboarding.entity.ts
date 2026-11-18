export type OnboardingStatus = 'PENDING' | 'VIEWED' | 'OFFER_CLAIMED' | 'COMPLETED';

export interface OnboardingProps {
  id: string;
  clientId: string;
  isFirstVisit: boolean;
  status: OnboardingStatus;
  welcomeDiscountCode: string;
  discountPercent: number;
  createdAt: Date;
  completedAt?: Date | null;
}

export class ClientOnboarding {
  constructor(private props: OnboardingProps) {}

  get id(): string { return this.props.id; }
  get clientId(): string { return this.props.clientId; }
  get isFirstVisit(): boolean { return this.props.isFirstVisit; }
  get status(): OnboardingStatus { return this.props.status; }
  get welcomeDiscountCode(): string { return this.props.welcomeDiscountCode; }
  get discountPercent(): number { return this.props.discountPercent; }
  get createdAt(): Date { return this.props.createdAt; }
  get completedAt(): Date | null { return this.props.completedAt ?? null; }

  markViewed(): void {
    if (this.props.status === 'PENDING') {
      this.props.status = 'VIEWED';
    }
  }

  claimOffer(): void {
    if (this.props.status === 'PENDING' || this.props.status === 'VIEWED') {
      this.props.status = 'OFFER_CLAIMED';
    }
  }

  completeOnboarding(): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
  }

  static create(clientId: string, isFirstVisit: boolean, discountPercent = 15): ClientOnboarding {
    const code = `FIRST-${clientId.substring(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return new ClientOnboarding({
      id: `onb_${Math.random().toString(36).substring(2, 10)}`,
      clientId,
      isFirstVisit,
      status: 'PENDING',
      welcomeDiscountCode: code,
      discountPercent,
      createdAt: new Date(),
      completedAt: null,
    });
  }
}
