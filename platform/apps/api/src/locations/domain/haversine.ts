// Відстань між координатами (км) — формула гаверсинуса. Потрібна для
// «найближча локація» (web-screens §1: герой/CTA; геолокація — фаза 9+).

const EARTH_RADIUS_KM = 6371;
const RAD = Math.PI / 180;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Відстань «як летить ворона» між двома точками, у кілометрах.
 * `from` — точка клієнта, `to` — точка локації. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = (to.latitude - from.latitude) * RAD;
  const dLng = (to.longitude - from.longitude) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(from.latitude * RAD) * Math.cos(to.latitude * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
