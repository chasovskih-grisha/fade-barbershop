import type { PartyLeg } from './party-leg.entity';
import type { Slot } from './slot.value-object';

export type AppointmentMode = 'sequential' | 'parallel';

export interface AppointmentPartyData {
  /** UUID */
  id: string;
  locationId: string;
  serviceId: string;
  /** Date of the appointment party (date part, time ignored) */
  date: Date;
  /** Mode – sequential (one chair) or parallel (two chairs) */
  mode: AppointmentMode;
  /** IDs of exactly two distinct barbers */
  barberIds: [string, string];
  /** Slots – one for sequential, two for parallel */
  slots: Slot[];
  /** Party legs – two participants (father & son) */
  partyLegs: PartyLeg[];
  /** Single agreed price reference */
  agreedPriceId: string;
  agreedPrice: number;
}

export class AppointmentParty {
  private constructor(private readonly data: AppointmentPartyData) {}

  static create(input: AppointmentPartyData): AppointmentParty {
    // Basic structural validation – deeper validation lives in the use‑case.
    if (input.barberIds.length !== 2) {
      throw new Error('Exactly two barber IDs required');
    }
    if (input.partyLegs.length !== 2) {
      throw new Error('Exactly two party legs required');
    }
    return new AppointmentParty(input);
  }

  get id(): string {
    return this.data.id;
  }
  get locationId(): string {
    return this.data.locationId;
  }
  get serviceId(): string {
    return this.data.serviceId;
  }
  get date(): Date {
    return this.data.date;
  }
  get mode(): AppointmentMode {
    return this.data.mode;
  }
  get barberIds(): [string, string] {
    return this.data.barberIds;
  }
  get slots(): Slot[] {
    return this.data.slots;
  }
  get partyLegs(): PartyLeg[] {
    return this.data.partyLegs;
  }
  get agreedPriceId(): string {
    return this.data.agreedPriceId;
  }
  get agreedPrice(): number {
    return this.data.agreedPrice;
  }
}
