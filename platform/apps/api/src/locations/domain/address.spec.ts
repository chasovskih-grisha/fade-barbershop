import { Address } from './address';

describe('Address VO', () => {
  it('створює валідну адресу та формує formatted() рядок', () => {
    const addr = Address.of({
      street: 'Хрещатик',
      building: '1',
      city: 'Київ',
      postalCode: '01001',
      country: 'UA',
    });
    expect(addr.street).toBe('Хрещатик');
    expect(addr.building).toBe('1');
    expect(addr.city).toBe('Київ');
    expect(addr.postalCode).toBe('01001');
    expect(addr.country).toBe('UA');
    expect(addr.formatted()).toBe('вул. Хрещатик, 1, Київ, 01001, Україна');
  });

  it('вимагає обовʼязкові поля', () => {
    expect(() => Address.of({ street: '', building: '1', city: 'Київ' })).toThrow();
    expect(() => Address.of({ street: 'Хрещатик', building: '', city: 'Київ' })).toThrow();
    expect(() => Address.of({ street: 'Хрещатик', building: '1', city: '' })).toThrow();
  });

  it('порівнює дві адреси через equals', () => {
    const a1 = Address.of({ street: 'А', building: '1', city: 'Київ' });
    const a2 = Address.of({ street: 'А', building: '1', city: 'Київ' });
    const a3 = Address.of({ street: 'Б', building: '2', city: 'Львів' });
    expect(a1.equals(a2)).toBe(true);
    expect(a1.equals(a3)).toBe(false);
  });
});
