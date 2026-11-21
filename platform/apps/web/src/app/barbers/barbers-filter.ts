export interface Barber {
  id: string;
  slug: string;
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  specialties?: string[] | null;
  experience?: string | null;
}

export type BarberFilter = 'all' | 'top' | 'beard' | 'fade';

function matchesSearch(barber: Barber, query: string): boolean {
  if (barber.name.toLowerCase().includes(query)) return true;
  if (barber.role && barber.role.toLowerCase().includes(query)) return true;
  return Boolean(barber.specialties?.some((s) => s.toLowerCase().includes(query)));
}

function matchesTop(barber: Barber): boolean {
  const role = barber.role?.toLowerCase() ?? '';
  if (role.includes('топ') || role.includes('старший')) return true;
  return Boolean(barber.experience && parseInt(barber.experience, 10) >= 5);
}

function matchesBeard(barber: Barber): boolean {
  return Boolean(
    barber.specialties?.some(
      (s) => s.toLowerCase().includes('бород') || s.toLowerCase().includes('beard')
    )
  );
}

function matchesFade(barber: Barber): boolean {
  return Boolean(
    barber.specialties?.some(
      (s) =>
        s.toLowerCase().includes('fade') ||
        s.toLowerCase().includes('фейд') ||
        s.toLowerCase().includes('класич')
    )
  );
}

/** Applies the search query and the active category filter to the barber list. */
export function filterBarbers(
  barbers: Barber[],
  activeFilter: BarberFilter,
  searchQuery: string
): Barber[] {
  const query = searchQuery.toLowerCase();
  return barbers.filter((barber) => {
    if (!matchesSearch(barber, query)) return false;
    switch (activeFilter) {
      case 'top':
        return matchesTop(barber);
      case 'beard':
        return matchesBeard(barber);
      case 'fade':
        return matchesFade(barber);
      default:
        return true;
    }
  });
}
