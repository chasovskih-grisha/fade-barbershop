import { AppointmentParty, type AppointmentPartyData } from './appointment-party.entity';
import { PartyLeg } from './party-leg.entity';
import { Slot } from './slot.value-object';

function data(overrides: Partial<AppointmentPartyData> = {}): AppointmentPartyData {
  return {
    id: 'party-1',
    locationId: 'loc-1',
    serviceId: 'father-son',
    date: new Date('2026-10-01T00:00:00Z'),
    mode: 'sequential',
    barberIds: ['b1', 'b1'],
    slots: [Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T10:30:00Z'))],
    partyLegs: [
      PartyLeg.create({ id: 'leg-1', role: 'father', name: 'Father', age: 40, barberId: 'b1' }),
      PartyLeg.create({ id: 'leg-2', role: 'son', name: 'Son', age: 10, barberId: 'b1' }),
    ],
    agreedPriceId: 'price-1',
    agreedPrice: 900,
    ...overrides,
  };
}

describe('AppointmentParty', () => {
  it('creates a party and exposes its fields', () => {
    const party = AppointmentParty.create(data());
    expect(party.id).toBe('party-1');
    expect(party.locationId).toBe('loc-1');
    expect(party.serviceId).toBe('father-son');
    expect(party.date.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(party.mode).toBe('sequential');
    expect(party.barberIds).toEqual(['b1', 'b1']);
    expect(party.slots).toHaveLength(1);
    expect(party.partyLegs).toHaveLength(2);
    expect(party.agreedPriceId).toBe('price-1');
    expect(party.agreedPrice).toBe(900);
  });

  it('rejects a party without exactly two barbers', () => {
    expect(() => AppointmentParty.create(data({ barberIds: ['b1'] as never }))).toThrow(
      'Exactly two barber IDs required'
    );
  });

  it('rejects a party without exactly two legs', () => {
    const [single] = data().partyLegs;
    if (!single) throw new Error('fixture must produce a leg');
    expect(() => AppointmentParty.create(data({ partyLegs: [single] }))).toThrow(
      'Exactly two party legs required'
    );
  });
});
