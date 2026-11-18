// PartyLeg – representation of a participant (son) in the appointment party.

export interface PartyLegData {
  /** Unique identifier for the leg */
  id: string;
  role: 'father' | 'son';
  /** Name of the participant (e.g., "John") */
  name: string;
  /** Age of the participant – used for pricing rules */
  age: number;
  /** Barber assigned to this leg (must be one of the party barbers) */
  barberId: string;
}

export class PartyLeg {
  private constructor(private readonly data: PartyLegData) {}

  static create(input: PartyLegData): PartyLeg {
    if (!input.id) throw new Error('PartyLeg.id is required');
    if (!input.name) throw new Error('PartyLeg.name is required');
    if (input.age <= 0) throw new Error('PartyLeg.age must be positive');
    if (!input.barberId) throw new Error('PartyLeg.barberId is required');
    if (input.role !== 'father' && input.role !== 'son')
      throw new Error('PartyLeg.role must be father or son');
    return new PartyLeg(input);
  }

  get id(): string {
    return this.data.id;
  }
  get role(): 'father' | 'son' {
    return this.data.role;
  }
  get name(): string {
    return this.data.name;
  }
  get age(): number {
    return this.data.age;
  }
  get barberId(): string {
    return this.data.barberId;
  }
}
