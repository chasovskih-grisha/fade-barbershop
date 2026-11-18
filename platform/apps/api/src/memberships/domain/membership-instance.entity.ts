export type MembershipStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELled' | 'COMPLETED';

export interface PauseRecord {
  pausedAt: Date;
  resumedAt?: Date;
}

export interface MembershipInstanceProps {
  id: string;
  clientId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  visitLimit: number; // -1 for unlimited
  remainingVisits: number; // -1 for unlimited
  status: MembershipStatus;
  pauseHistory: PauseRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export class MembershipInstance {
  private constructor(private readonly props: MembershipInstanceProps) {}

  public static reconstitute(props: MembershipInstanceProps): MembershipInstance {
    return new MembershipInstance({
      ...props,
      pauseHistory: props.pauseHistory.map((p) => ({ ...p })),
    });
  }

  public static createNew(params: {
    id: string;
    clientId: string;
    planId: string;
    visitLimit: number;
    durationDays: number;
    now: Date;
  }): MembershipInstance {
    const startDate = new Date(params.now.getTime());
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + params.durationDays);

    return new MembershipInstance({
      id: params.id,
      clientId: params.clientId,
      planId: params.planId,
      startDate,
      endDate,
      visitLimit: params.visitLimit,
      remainingVisits: params.visitLimit, // -1 means unlimited
      status: 'ACTIVE',
      pauseHistory: [],
      createdAt: params.now,
      updatedAt: params.now,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get clientId(): string {
    return this.props.clientId;
  }

  public get planId(): string {
    return this.props.planId;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date {
    return this.props.endDate;
  }

  public get visitLimit(): number {
    return this.props.visitLimit;
  }

  public get remainingVisits(): number {
    return this.props.remainingVisits;
  }

  public get status(): MembershipStatus {
    return this.props.status;
  }

  public get pauseHistory(): PauseRecord[] {
    return this.props.pauseHistory.map((p) => ({ ...p }));
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get propsData(): MembershipInstanceProps {
    return {
      ...this.props,
      pauseHistory: this.pauseHistory,
    };
  }

  public isExpired(now: Date): boolean {
    return now.getTime() > this.props.endDate.getTime();
  }

  public useVisit(now: Date): { remainingVisits: number } {
    if (this.props.status !== 'ACTIVE') {
      throw new Error(`Cannot use membership visit when status is '${this.props.status}'`);
    }
    if (this.isExpired(now)) {
      this.props.status = 'EXPIRED';
      this.props.updatedAt = now;
      throw new Error('Membership has expired');
    }
    if (this.props.visitLimit !== -1 && this.props.remainingVisits <= 0) {
      throw new Error('Membership visit limit has been reached');
    }

    if (this.props.visitLimit !== -1) {
      this.props.remainingVisits -= 1;
      if (this.props.remainingVisits === 0) {
        this.props.status = 'COMPLETED';
      }
    }
    this.props.updatedAt = now;
    return { remainingVisits: this.props.remainingVisits };
  }

  public pause(now: Date): void {
    if (this.props.status !== 'ACTIVE') {
      throw new Error(`Cannot pause membership in status '${this.props.status}'`);
    }
    if (this.isExpired(now)) {
      this.props.status = 'EXPIRED';
      throw new Error('Cannot pause expired membership');
    }
    this.props.status = 'PAUSED';
    this.props.pauseHistory.push({ pausedAt: now });
    this.props.updatedAt = now;
  }

  public resume(now: Date): void {
    if (this.props.status !== 'PAUSED') {
      throw new Error(`Cannot resume membership in status '${this.props.status}'`);
    }
    const lastPause = this.props.pauseHistory[this.props.pauseHistory.length - 1];
    if (!lastPause || lastPause.resumedAt) {
      throw new Error('No active pause record found to resume');
    }

    lastPause.resumedAt = now;
    const pausedDurationMs = now.getTime() - lastPause.pausedAt.getTime();
    
    // Extend endDate by the duration of the pause
    this.props.endDate = new Date(this.props.endDate.getTime() + pausedDurationMs);
    this.props.status = 'ACTIVE';
    this.props.updatedAt = now;
  }

  public checkExpiration(now: Date): void {
    if (this.props.status === 'ACTIVE' && this.isExpired(now)) {
      this.props.status = 'EXPIRED';
      this.props.updatedAt = now;
    }
  }
}
