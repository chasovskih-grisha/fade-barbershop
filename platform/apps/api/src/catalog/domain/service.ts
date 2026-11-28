import type { DurationVariant } from './duration-variant';

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
  /** Варіанти тривалості (T-4419); без них послуга — стандарт. */
  variants?: DurationVariant[] | null;
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
  get variants(): DurationVariant[] | null {
    return this.props.variants ?? null;
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

  update(changes: Partial<Omit<ServiceProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) (this.props as unknown as Record<string, unknown>)[key] = value;
    }
    this.props.updatedAt = new Date();
  }

  static toProps(service: Service): ServiceProps {
    return service.propsData;
  }
}
