export interface AppointmentPartyRepository {
  /** Persist a new party */
  save(party: import('../domain/appointment-party.entity').AppointmentParty): Promise<void>;
  /** Find by UUID */
  findById(
    id: string
  ): Promise<import('../domain/appointment-party.entity').AppointmentParty | null>;
  /** Find parties on a given date (for conflict checks) */
  findByDate(date: Date): Promise<import('../domain/appointment-party.entity').AppointmentParty[]>;
}
