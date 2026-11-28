export interface Barber {
  id: string;
  slug: string;
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  specialties?: string[] | null;
  experience?: string | null;
  portfolioThumbUrl?: string | null;
  /** Студії людини (T-4852a): код і назва локації, де вона працює. */
  studios?: { code: string; name: string }[] | null;
}

export type BarberFilter = 'all' | 'top' | 'beard' | 'fade';

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

const CATEGORY: Record<BarberFilter, (barber: Barber) => boolean> = {
  all: () => true,
  top: matchesTop,
  beard: matchesBeard,
  fade: matchesFade,
};

// T-4857a: пошук звужує картки за ім'ям майстра без урахування регістру, а
// категорія — за спеціалізацією; порожній запит (самі пробіли) не звужує.
export function filterBarbers(
  barbers: Barber[],
  activeFilter: BarberFilter,
  searchQuery: string
): Barber[] {
  const needle = searchQuery.trim().toLowerCase();
  const category = CATEGORY[activeFilter];
  return barbers.filter(
    (barber) => (!needle || barber.name.toLowerCase().includes(needle)) && category(barber)
  );
}
