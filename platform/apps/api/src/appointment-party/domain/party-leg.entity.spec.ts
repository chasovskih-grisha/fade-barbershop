import { PartyLeg } from './party-leg.entity';

describe('PartyLeg', () => {
  const valid = { id: 'leg-1', role: 'father' as const, name: 'Father', age: 40, barberId: 'b1' };

  it('creates a leg and exposes its fields', () => {
    const leg = PartyLeg.create(valid);
    expect(leg.id).toBe('leg-1');
    expect(leg.role).toBe('father');
    expect(leg.name).toBe('Father');
    expect(leg.age).toBe(40);
    expect(leg.barberId).toBe('b1');
  });

  it('rejects missing id/name/barberId and non-positive age and invalid role', () => {
    expect(() => PartyLeg.create({ ...valid, id: '' })).toThrow('PartyLeg.id is required');
    expect(() => PartyLeg.create({ ...valid, name: '' })).toThrow('PartyLeg.name is required');
    expect(() => PartyLeg.create({ ...valid, age: 0 })).toThrow('PartyLeg.age must be positive');
    expect(() => PartyLeg.create({ ...valid, barberId: '' })).toThrow(
      'PartyLeg.barberId is required'
    );
    expect(() => PartyLeg.create({ ...valid, role: 'sibling' as never })).toThrow(
      'PartyLeg.role must be father or son'
    );
  });

  it('accepts a son role', () => {
    const leg = PartyLeg.create({ ...valid, role: 'son', name: 'Son' });
    expect(leg.role).toBe('son');
  });
});
