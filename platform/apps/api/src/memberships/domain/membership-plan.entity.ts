export interface MembershipPlanProps {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number; // e.g., 30, 90, 180, 365
  visitLimit: number; // -1 for unlimited, or N visits
  discountPercent: number; // e.g. 15% discount on over-limit or additional services
  isActive: boolean;
  createdAt: Date;
}

export class MembershipPlan {
  private constructor(private readonly props: MembershipPlanProps) {}

  public static reconstitute(props: MembershipPlanProps): MembershipPlan {
    return new MembershipPlan({ ...props });
  }

  public static createNew(params: {
    id: string;
    name: string;
    price: number;
    currency?: string;
    durationDays?: number;
    visitLimit?: number;
    discountPercent?: number;
    now: Date;
  }): MembershipPlan {
    if (params.price < 0) {
      throw new Error('Membership plan price cannot be negative');
    }
    const durationDays = params.durationDays ?? 30;
    if (durationDays <= 0) {
      throw new Error('Membership duration must be greater than zero days');
    }

    return new MembershipPlan({
      id: params.id,
      name: params.name.trim(),
      price: params.price,
      currency: params.currency ?? 'UAH',
      durationDays,
      visitLimit: params.visitLimit ?? 10,
      discountPercent: params.discountPercent ?? 10,
      isActive: true,
      createdAt: params.now,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get price(): number {
    return this.props.price;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public get durationDays(): number {
    return this.props.durationDays;
  }

  public get visitLimit(): number {
    return this.props.visitLimit;
  }

  public get discountPercent(): number {
    return this.props.discountPercent;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get propsData(): MembershipPlanProps {
    return { ...this.props };
  }
}
