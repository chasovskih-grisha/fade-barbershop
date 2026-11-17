// Координати локації (lat/lng) — value object. Потрібні для карти на сайті
// (MNG-ADM-01: «Координати … обов'язкові (для карти на сайті)»).

export class Coordinates {
  private constructor(
    public readonly lat: number,
    public readonly lng: number
  ) {}

  static of(lat: number, lng: number): Coordinates {
    if (lat < -90 || lat > 90) throw new Error('lat must be in [-90, 90]');
    if (lng < -180 || lng > 180) throw new Error('lng must be in [-180, 180]');
    return new Coordinates(lat, lng);
  }

  equals(other: Coordinates): boolean {
    return this.lat === other.lat && this.lng === other.lng;
  }
}
