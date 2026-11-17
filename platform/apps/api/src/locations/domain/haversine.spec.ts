// distanceKm — доменна математика відстані (гаверсинус).

import { distanceKm } from './haversine';

const KYIV = { latitude: 50.4501, longitude: 30.5234 };
const LVIV = { latitude: 49.8397, longitude: 24.0297 };

describe('distanceKm', () => {
  it('та сама точка — 0 км', () => {
    expect(distanceKm(KYIV, KYIV)).toBe(0);
  });

  it('Київ → Львів ≈ 464 км (толерантність ±5 км)', () => {
    const d = distanceKm(KYIV, LVIV);
    expect(d).toBeGreaterThan(459);
    expect(d).toBeLessThan(469);
  });

  it('симетрична', () => {
    const ab = distanceKm(KYIV, LVIV);
    const ba = distanceKm(LVIV, KYIV);
    expect(ab).toBeCloseTo(ba, 9);
  });

  it('екватор навколо землі (0,0) → (0,180) ≈ половина довжини екватора', () => {
    const d = distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20016);
  });

  it('полюс → екватор ≈ 10 007 км', () => {
    const d = distanceKm({ latitude: 90, longitude: 0 }, { latitude: 0, longitude: 0 });
    expect(d).toBeGreaterThan(10002);
    expect(d).toBeLessThan(10012);
  });
});
