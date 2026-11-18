export interface ServiceProps {
  id: string;
  name: string;
  duration: number; // хвилини
  parallelDuration: number | null;
  description: string | null;
  category: string | null;
  slug: string | null;
  seoDescription: string | null;
  faq: any | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Service {
  private constructor(private readonly props: ServiceProps) {}

  static restore(props: ServiceProps): Service {
    return new Service(props);
  }

  static create(
    props: Omit<ServiceProps, 'id' | 'createdAt' | 'updatedAt'> & { id: string }
  ): Service {
    return new Service({ ...props, createdAt: new Date(), updatedAt: new Date() });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get duration(): number {
    return this.props.duration;
  }
  get parallelDuration(): number | null {
    return this.props.parallelDuration;
  }
  get description(): string | null {
    return this.props.description;
  }
  get category(): string | null {
    return this.props.category;
  }
  get slug(): string | null {
    return this.props.slug;
  }
  get seoDescription(): string | null {
    return this.props.seoDescription;
  }
  get faq(): any | null {
    return this.props.faq;
  }
  get active(): boolean {
    return this.props.active;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get propsData(): ServiceProps {
    return { ...this.props };
  }
  get propsSnapshot(): ServiceProps {
    return { ...this.props };
  }

  setActive(active: boolean): void {
    this.props.active = active;
  }
  setSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
  }

  update(changes: {
    name?: string;
    duration?: number;
    parallelDuration?: number | null;
    description?: string | null;
    category?: string | null;
    slug?: string | null;
    seoDescription?: string | null;
    faq?: any | null;
    sortOrder?: number;
  }): void {
    if (changes.name !== undefined) this.props.name = changes.name;
    if (changes.duration !== undefined) this.props.duration = changes.duration;
    if (changes.parallelDuration !== undefined)
      this.props.parallelDuration = changes.parallelDuration;
    if (changes.description !== undefined) this.props.description = changes.description;
    if (changes.category !== undefined) this.props.category = changes.category;
    if (changes.slug !== undefined) this.props.slug = changes.slug;
    if (changes.seoDescription !== undefined) this.props.seoDescription = changes.seoDescription;
    if (changes.faq !== undefined) this.props.faq = changes.faq;
    if (changes.sortOrder !== undefined) this.props.sortOrder = changes.sortOrder;
    this.props.updatedAt = new Date();
  }

  static toProps(service: Service): ServiceProps {
    return service.propsData;
  }
}
