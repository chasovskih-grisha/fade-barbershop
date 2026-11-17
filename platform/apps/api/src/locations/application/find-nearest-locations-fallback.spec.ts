// FindNearestLocationsHandler — фолбек на фільтр міста / звичайний список.

import { FindNearestLocationsHandler } from './find-nearest-locations';
import { FakeGeocoder } from './ports.fakes';
import { ODESA, seedKyivLviv } from './find-nearest-locations.fakes';

describe('FindNearestLocationsHandler geocoder fallbacks', () => {
  it('за радіусом, місто збігається з адресою — фільтр по місту', async () => {
    const seed = await seedKyivLviv();
    // Клієнт в Одесі, але геокодер (наприклад, по вишці) повертає «Львів» —
    // адреса львівської локації містить місто → фільтр по місту попри відстань.
    const result = await new FindNearestLocationsHandler(
      seed.locations,
      new FakeGeocoder('Львів')
    ).handle({ lat: ODESA.lat, lng: ODESA.lng });
    expect(result.sortedByDistance).toBe(false);
    expect(result.city).toBe('Львів');
    expect(result.locations.map((e) => e.location.code)).toEqual(['CLT-02']);
  });

  it('за радіусом, міста немає в мережі — всі локації, початковий порядок', async () => {
    const seed = await seedKyivLviv();
    const result = await new FindNearestLocationsHandler(
      seed.locations,
      new FakeGeocoder('Дніпро')
    ).handle({ lat: 48.4647, lng: 35.0462 }); // Дніпро
    expect(result.city).toBe('Дніпро');
    expect(result.sortedByDistance).toBe(false);
    expect(result.locations.map((e) => e.location.code)).toEqual(['CLT-01', 'CLT-02']);
  });

  it('геокодер падає — фолбек на звичайний список без винятку', async () => {
    const seed = await seedKyivLviv();
    const result = await new FindNearestLocationsHandler(
      seed.locations,
      new FakeGeocoder('Львів', true)
    ).handle({ lat: ODESA.lat, lng: ODESA.lng });
    expect(result.city).toBeNull();
    expect(result.sortedByDistance).toBe(false);
    expect(result.locations).toHaveLength(2);
  });

  it('геокодер повертає null — як без міста', async () => {
    const seed = await seedKyivLviv();
    const result = await new FindNearestLocationsHandler(
      seed.locations,
      new FakeGeocoder(null)
    ).handle({ lat: ODESA.lat, lng: ODESA.lng });
    expect(result.city).toBeNull();
    expect(result.locations).toHaveLength(2);
  });
});
