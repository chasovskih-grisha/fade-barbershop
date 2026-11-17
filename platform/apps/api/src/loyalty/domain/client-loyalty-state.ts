export interface ClientLoyaltyStateProps {
  clientId: string;
  counter: number; // 0 to threshold - 1 (e.g. 0..6)
  hasFreeVisit: boolean;
  tier?: string;
  pointsBalance?: number;
  cashbackBalance?: number;
  processedAppointmentIds: string[];
  updatedAt: Date;
}

export class ClientLoyaltyState {
  private constructor(private readonly props: ClientLoyaltyStateProps) {}

  static reconstitute(props: ClientLoyaltyStateProps): ClientLoyaltyState {
    return new ClientLoyaltyState({
      ...props,
      processedAppointmentIds: props.processedAppointmentIds ? [...props.processedAppointmentIds] : [],
    });
  }

  static createNew(clientId: string, now: Date): ClientLoyaltyState {
    return new ClientLoyaltyState({
      clientId,
      counter: 0,
      hasFreeVisit: false,
      processedAppointmentIds: [],
      updatedAt: now,
    });
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get counter(): number {
    return this.props.counter;
  }

  get hasFreeVisit(): boolean {
    return this.props.hasFreeVisit;
  }

  get tier(): string {
    return this.props.tier ?? 'BRONZE';
  }

  get pointsBalance(): number {
    return this.props.pointsBalance ?? 0;
  }

  get cashbackBalance(): number {
    return this.props.cashbackBalance ?? 0;
  }

  get processedAppointmentIds(): string[] {
    return [...(this.props.processedAppointmentIds ?? [])];
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get propsData(): ClientLoyaltyStateProps {
    return {
      ...this.props,
      processedAppointmentIds: [...(this.props.processedAppointmentIds ?? [])],
    };
  }

  isProcessed(appointmentId: string): boolean {
    return (this.props.processedAppointmentIds ?? []).includes(appointmentId);
  }

  processCompletedAppointment(
    appointmentId: string,
    threshold: number,
    wasFreeVisit: boolean,
    now: Date
  ): { granted: boolean; used: boolean; incremented: boolean } {
    if (!this.props.processedAppointmentIds) {
      this.props.processedAppointmentIds = [];
    }

    if (this.isProcessed(appointmentId)) {
      return { granted: false, used: false, incremented: false };
    }

    this.props.processedAppointmentIds.push(appointmentId);
    this.props.updatedAt = now;

    if (wasFreeVisit || this.props.hasFreeVisit) {
      // Free visit was consumed
      this.props.hasFreeVisit = false;
      this.props.counter = 0;
      return { granted: false, used: true, incremented: false };
    }

    const oldCount = this.props.counter;
    const newCount = oldCount + 1;

    if (newCount >= threshold) {
      this.props.counter = 0;
      this.props.hasFreeVisit = true;
      return { granted: true, used: false, incremented: true };
    } else {
      this.props.counter = newCount;
      return { granted: false, used: false, incremented: true };
    }
  }

  applyFreeVisit(appointmentId: string, now: Date): boolean {
    if (!this.props.hasFreeVisit) {
      return false;
    }
    this.props.hasFreeVisit = false;
    this.props.updatedAt = now;
    return true;
  }

  adjustCounter(newCount: number, now: Date): void {
    this.props.counter = Math.max(0, newCount);
    this.props.updatedAt = now;
  }

  setFreeVisit(hasFreeVisit: boolean, now: Date): void {
    this.props.hasFreeVisit = hasFreeVisit;
    this.props.updatedAt = now;
  }

  setTier(tier: string, now: Date): void {
    this.props.tier = tier;
    this.props.updatedAt = now;
  }

  addPoints(points: number, now: Date): void {
    this.props.pointsBalance = (this.props.pointsBalance ?? 0) + Math.max(0, points);
    this.props.updatedAt = now;
  }

  spendPoints(points: number, now: Date): boolean {
    const current = this.props.pointsBalance ?? 0;
    if (current < points || points <= 0) {
      return false;
    }
    this.props.pointsBalance = current - points;
    this.props.updatedAt = now;
    return true;
  }

  addCashback(amount: number, now: Date): void {
    this.props.cashbackBalance = (this.props.cashbackBalance ?? 0) + Math.max(0, amount);
    this.props.updatedAt = now;
  }

  spendCashback(amount: number, now: Date): boolean {
    const current = this.props.cashbackBalance ?? 0;
    if (current < amount || amount <= 0) {
      return false;
    }
    this.props.cashbackBalance = current - amount;
    this.props.updatedAt = now;
    return true;
  }
}
