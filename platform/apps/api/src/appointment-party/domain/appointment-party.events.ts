import type { AppointmentParty } from '../domain/appointment-party.entity';

export class AppointmentPartyCreated {
  constructor(public readonly appointmentParty: AppointmentParty) {}
}

export class AppointmentPartyConfirmed {
  constructor(public readonly appointmentPartyId: string) {}
}
