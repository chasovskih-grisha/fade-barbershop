/* eslint-disable max-params -- 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Структурована адреса локації — value object (T-4405, MNG-ADM-01).

export interface AddressProps {
  street: string;
  building: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export class Address {
  private constructor(
    public readonly street: string,
    public readonly building: string,
    public readonly city: string,
    public readonly postalCode: string | null,
    public readonly country: string
  ) {}

  static of(props: AddressProps): Address {
    if (!props.street?.trim()) throw new Error('street is required');
    if (!props.building?.trim()) throw new Error('building is required');
    if (!props.city?.trim()) throw new Error('city is required');
    return new Address(
      props.street.trim(),
      props.building.trim(),
      props.city.trim(),
      props.postalCode?.trim() || null,
      props.country?.trim() || 'UA'
    );
  }

  formatted(): string {
    const parts = [
      `вул. ${this.street}`,
      this.building,
      this.city,
      this.postalCode,
      this.country === 'UA' ? 'Україна' : this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.building === other.building &&
      this.city === other.city &&
      this.postalCode === other.postalCode &&
      this.country === other.country
    );
  }
}
