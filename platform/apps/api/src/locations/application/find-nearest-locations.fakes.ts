import { seedLocation, weekDays } from '../test-helpers.fakes';

export const KYIV = { lat: 50.4501, lng: 30.5234 };
/** ~5 км від центру Києва. */
export const NEAR_KYIV = { lat: 50.485, lng: 30.49 };
/** ~460 км від Києва. */
export const LVIV = { lat: 49.8397, lng: 24.0297 };
/** Позаду мережі (Одеса): ~440 км від Києва, ~600 км від Львова. */
export const ODESA = { lat: 46.4825, lng: 30.7233 };

/** Київ + Львів (обидві активні). */
export async function seedKyivLviv() {
  const seed = await seedLocation({
    code: 'clt-01',
    name: 'Fade Kyiv',
    address: 'вул. Хрещатик, 1, Київ',
    lat: KYIV.lat,
    lng: KYIV.lng,
  });
  await seed.create.handle({
    code: 'clt-02',
    name: 'Fade Lviv',
    address: 'пл. Ринок, 1, Львів',
    lat: LVIV.lat,
    lng: LVIV.lng,
    phone: null,
    email: null,
    hours: weekDays(),
  });
  return seed;
}
