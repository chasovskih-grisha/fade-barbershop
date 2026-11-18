import { AppointmentPartyCreated, AppointmentPartyConfirmed } from './appointment-party.events';
import { AppointmentParty, type AppointmentPartyData } from './appointment-party.entity';
import { PartyLeg } from './party-leg.entity';
import { Slot } from './slot.value-object';

describe('appointment-party domain events', () => {
  const data: AppointmentPartyData = {
    id: 'party-1',
    locationId: 'loc-1',
    serviceId: 's',
    date: new Date('2026-10-01T00:00:00Z'),
    mode: 'sequential',
    barberIds: ['b1', 'b1'],
    slots: [Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T10:30:00Z'))],
    partyLegs: [
      PartyLeg.create({ id: 'leg-1', role: 'father', name: 'F', age: 40, barberId: 'b1' }),
      PartyLeg.create({ id: 'leg-2', role: 'son', name: 'S', age: 10, barberId: 'b1' }),
    ],
    agreedPriceId: 'p',
    agreedPrice: 900,
  };

  it('AppointmentPartyCreated carries the full party aggregate', () => {
    const party = AppointmentParty.create(data);
    const event = new AppointmentPartyCreated(party);
    expect(event.appointmentParty).toBe(party);
  });

  it('AppointmentPartyConfirmed carries the party id', () => {
    const event = new AppointmentPartyConfirmed('party-1');
    expect(event.appointmentPartyId).toBe('party-1');
  });
});
