import { FindNearestLocationsHandler, NEAREST_RADIUS_KM } from './find-nearest-locations';
import { weekDays } from '../test-helpers.fakes';
import { LVIV, NEAR_KYIV, seedKyivLviv } from './find-nearest-locations.fakes';

describe('FindNearestLocationsHandler', () => {
  it('без координат — початковий порядок, дистанції null', async () => {
    const seed = await seedKyivLviv();
    const result = await new FindNearestLocationsHandler(seed.locations).handle({});
    expect(result.sortedByDistance).toBe(false);
    expect(result.city).toBeNull();
    expect(result.locations.map((e) => e.location.code)).toEqual(['CLT-01', 'CLT-02']);
    expect(result.locations.every((e) => e.distanceKm === null)).toBe(true);
  });

  it('клієнт у радіусі — лише ближні локації, сорт за відстанню', async () => {
    const seed = await seedKyivLviv();
    await seed.create.handle({
      code: 'clt-03',
      name: 'Fade Brovary',
      address: 'Бровари, вул. Київська, 100',
      lat: 50.755,
      lng: 31.0,
      phone: null,
      email: null,
      hours: weekDays(),
    });
    const result = await new FindNearestLocationsHandler(seed.locations).handle({
      lat: NEAR_KYIV.lat,
      lng: NEAR_KYIV.lng,
    });
    expect(result.sortedByDistance).toBe(true);
    const codes = result.locations.map((e) => e.location.code);
    expect(codes).toContain('CLT-01');
    expect(codes).toContain('CLT-03');
    // Львів (~460 км) — за радіусом.
    expect(codes).not.toContain('CLT-02');
    // Сорт за зростанням дистанції; Київ (~5 км) ближчий за Бровари (~28 км).
    const distances = result.locations.map((e) => e.distanceKm as number);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
    expect(codes[0]).toBe('CLT-01');
  });

  it('клієнт точно на локації — дистанція 0, сорт спрацьовує', async () => {
    const seed = await seedKyivLviv();
    const result = await new FindNearestLocationsHandler(seed.locations).handle({
      lat: LVIV.lat,
      lng: LVIV.lng,
    });
    expect(result.sortedByDistance).toBe(true);
    expect(result.locations.map((e) => e.location.code)).toEqual(['CLT-02']);
    expect(result.locations[0]?.distanceKm).toBe(0);
  });

  it('радіус — 50 км (контракт для UI-копії і тестів)', () => {
    expect(NEAREST_RADIUS_KM).toBe(50);
  });
});
