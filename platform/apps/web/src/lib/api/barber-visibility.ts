import type { Barber, BarberDto } from './staff';

// T-4865a: відсутній прапорець означає «показувати». Публічна відповідь може
// бути старшою за прапорець, і мовчазне приховування зламало б усю сторінку.
export function mapBarber(dto: BarberDto): Barber {
  return {
    id: dto.id,
    userId: dto.id,
    slug: dto.id.toLowerCase(),
    name: dto.name,
    role: 'Майстер-барбер',
    active: dto.active !== false,
    photoUrl: dto.photo?.url ?? null,
    portfolioThumbUrl: null,
  };
}

/** Довідник показує лише тих, хто ще приймає запис. */
export function listedBarbers(barbers: Barber[]): Barber[] {
  return barbers.filter((barber) => barber.active);
}
