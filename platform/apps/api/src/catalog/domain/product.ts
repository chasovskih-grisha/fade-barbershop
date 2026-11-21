import { uuidv7 } from '@fade/domain-shared';

export interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  photoUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private readonly props: ProductProps) {
    if (props.photoUrl && !props.photoUrl.includes('media.fade.com.ua')) {
      throw new Error('Product photoUrl must be hosted on media.fade.com.ua (SHOP-003)');
    }
  }

  static restore(props: ProductProps): Product {
    return new Product(props);
  }

  static create(
    props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt' | 'active'> & {
      id?: string;
      active?: boolean;
    }
  ): Product {
    return new Product({
      id: props.id ?? uuidv7(),
      name: props.name,
      description: props.description ?? null,
      brand: props.brand ?? null,
      category: props.category ?? null,
      photoUrl: props.photoUrl ?? null,
      active: props.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get brand(): string | null {
    return this.props.brand;
  }
  get category(): string | null {
    return this.props.category;
  }
  get photoUrl(): string | null {
    return this.props.photoUrl;
  }
  get active(): boolean {
    return this.props.active;
  }
  get propsSnapshot(): ProductProps {
    return { ...this.props };
  }

  setActive(active: boolean): void {
    this.props.active = active;
    this.props.updatedAt = new Date();
  }

  update(changes: Partial<Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (changes.name !== undefined) this.props.name = changes.name;
    if (changes.description !== undefined) this.props.description = changes.description;
    if (changes.brand !== undefined) this.props.brand = changes.brand;
    if (changes.category !== undefined) this.props.category = changes.category;
    if (changes.photoUrl !== undefined) {
      if (changes.photoUrl && !changes.photoUrl.includes('media.fade.com.ua')) {
        throw new Error('Product photoUrl must be hosted on media.fade.com.ua (SHOP-003)');
      }
      this.props.photoUrl = changes.photoUrl;
    }
    if (changes.active !== undefined) this.props.active = changes.active;
    this.props.updatedAt = new Date();
  }
}
