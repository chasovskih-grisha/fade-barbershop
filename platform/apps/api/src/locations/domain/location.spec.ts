import { Coordinates } from './coordinates';
import { OpeningHours } from './opening-hours';
import { Chair } from './chair';
import { Location } from './location';
import { T0, weekDays } from '../test-helpers.fakes';

describe('Location', () => {
  function input() {
    return {
      id: 'loc-1',
      code: 'clt-01',
      name: 'Fade Baumana',
      address: 'вул. Богдана Хмельницького, 23',
      coordinates: Coordinates.of(50.4501, 30.5234),
      hours: OpeningHours.of(weekDays()),
      createdAt: new Date(T0),
    };
  }

  it('створює агрегат: код верхнім регістром, 2 активні крісла', () => {
    const location = Location.create(input());
    expect(location.code).toBe('CLT-01');
    expect(location.name).toBe('Fade Baumana');
    expect(location.active).toBe(true);
    expect(location.chairs.map((c) => c.number)).toEqual([1, 2]);
    expect(location.chairs.every((c) => c.active)).toBe(true);
  });

  it('відхиляє порожній код/назву/адресу', () => {
    expect(() => Location.create({ ...input(), code: '  ' })).toThrow('Code');
    expect(() => Location.create({ ...input(), name: ' ' })).toThrow('Name');
    expect(() => Location.create({ ...input(), address: ' ' })).toThrow('Address');
  });

  it('updateProfile оновлює частково і повідомляє про зміну', () => {
    const location = Location.create(input());
    // prettier-ignore
    expect(location.updateProfile({ name: 'Fade Podil', email: 'podil@fade.ua', phone: '+380501234567' })).toBe(true);
    expect(location.name).toBe('Fade Podil');
    expect(location.email).toBe('podil@fade.ua');
    expect(location.phone).toBe('+380501234567');
    expect(location.updateProfile({ name: 'Fade Podil' })).toBe(false);
  });

  it('updateProfile оновлює адресу та координати', () => {
    const location = Location.create(input());
    // prettier-ignore
    expect(location.updateProfile({ address: 'вул. Хрещатик, 1', coordinates: Coordinates.of(50.45, 30.52) })).toBe(true);
    expect(location.address).toBe('вул. Хрещатик, 1');
    expect(location.lat).toBe(50.45);
    expect(location.lng).toBe(30.52);
  });

  it('setActive ідемпотентно', () => {
    const location = Location.create(input());
    expect(location.setActive(false)).toBe(true);
    expect(location.active).toBe(false);
    expect(location.setActive(false)).toBe(false);
  });

  it('setHours порівнює рівність', () => {
    const location = Location.create(input());
    // prettier-ignore
    expect(location.setHours(OpeningHours.of(weekDays({ 6: { open: '10:00', close: '18:00' } })))).toBe(true);
    // prettier-ignore
    expect(location.setHours(OpeningHours.of(weekDays({ 6: { open: '10:00', close: '18:00' } })))).toBe(false);
  });

  it('setChairs вимагає рівно 2 крісла', () => {
    const location = Location.create(input());
    expect(() => location.setChairs([Chair.of(1, null, true)])).toThrow('exactly 2');
  });

  it('reconstitute відтворює стан із БД', () => {
    const location = Location.reconstitute({
      id: 'loc-1',
      code: 'CLT-01',
      name: 'Fade Baumana',
      address: 'вул. Богдана Хмельницького, 23',
      addressParts: null,
      lat: 50.4501,
      lng: 30.5234,
      phone: null,
      email: null,
      active: false,
      chairs: [Chair.of(1, null, true), Chair.of(2, null, false)],
      channels: [],
      photos: [],
      hours: OpeningHours.of(weekDays()),
      createdAt: new Date(T0),
    });
    expect(location.active).toBe(false);
    expect(location.lat).toBe(50.4501);
    expect(location.chairs[1]?.active).toBe(false);
  });
});
