/* eslint-disable max-lines, max-params -- cohesive module (102 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SegmentType = 'SLEEPING_60' | 'NO_SECOND_VISIT' | 'FORMER_VIP' | 'ALMOST_FREE';

export interface CampaignProps {
  id: string;
  name: string;
  segment: SegmentType;
  discountCode: string;
  discountPercent: number;
  validDays: number;
  status: CampaignStatus;
  targetCount: number;
  sentCount: number;
  usedCount: number;
  revenueGenerated: number;
  createdAt: Date;
  lastSentAt?: Date | null;
}

export class WinbackCampaign {
  constructor(private props: CampaignProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get segment(): SegmentType {
    return this.props.segment;
  }
  get discountCode(): string {
    return this.props.discountCode;
  }
  get discountPercent(): number {
    return this.props.discountPercent;
  }
  get validDays(): number {
    return this.props.validDays;
  }
  get status(): CampaignStatus {
    return this.props.status;
  }
  get targetCount(): number {
    return this.props.targetCount;
  }
  get sentCount(): number {
    return this.props.sentCount;
  }
  get usedCount(): number {
    return this.props.usedCount;
  }
  get revenueGenerated(): number {
    return this.props.revenueGenerated;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get lastSentAt(): Date | null {
    return this.props.lastSentAt ?? null;
  }

  activate(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error(`Cannot activate campaign in status ${this.props.status}`);
    }
    this.props.status = 'ACTIVE';
  }

  recordSend(count: number): void {
    if (this.props.status !== 'ACTIVE') {
      throw new Error('Can only send active campaigns');
    }
    this.props.sentCount += count;
    this.props.lastSentAt = new Date();
  }

  recordUsage(revenueAmount: number): void {
    this.props.usedCount += 1;
    this.props.revenueGenerated += revenueAmount;
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
  }

  static create(
    name: string,
    segment: SegmentType,
    discountPercent: number,
    validDays: number,
    targetCount: number
  ): WinbackCampaign {
    const code = `WINBACK-${segment}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return new WinbackCampaign({
      id: `cmp_${Math.random().toString(36).substring(2, 10)}`,
      name,
      segment,
      discountCode: code,
      discountPercent,
      validDays,
      status: 'DRAFT',
      targetCount,
      sentCount: 0,
      usedCount: 0,
      revenueGenerated: 0,
      createdAt: new Date(),
    });
  }
}
