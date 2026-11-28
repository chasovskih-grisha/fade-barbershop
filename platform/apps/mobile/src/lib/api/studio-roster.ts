import { fetchBarbers, listedBarbers, type BarberDto } from './barbers';
import { fetchLocations } from './locations';

/** Один блок довідника — студія та її люди (T-4852b). */
export interface StudioRoster {
  code: string;
  name: string;
  barbers: BarberDto[];
}

/**
 * GET /booking/barbers/:locationId приймає саме locationId, тож довідник питає
 * кожну активну студію, а не першу. Людина з двома призначеннями — одна
 * картка в першій студії; порожня студія не дає заголовка (T-4852b).
 */
export async function fetchBarbersByStudio(): Promise<StudioRoster[]> {
  const locations = (await fetchLocations()).filter((location) => location.active);
  // T-4868: порожній список студій — збій конфігурації, а не «майстрів немає».
  if (locations.length === 0) throw new Error('No active studios');
  const replies = await Promise.all(locations.map((location) => fetchBarbers(location.id)));
  const seen = new Set<string>();

  return locations
    .map((location, index) => ({
      code: location.code,
      name: location.name,
      barbers: listedBarbers(replies[index] ?? []).filter((barber) => {
        if (seen.has(barber.id)) return false;
        seen.add(barber.id);
        return true;
      }),
    }))
    .filter((roster) => roster.barbers.length > 0);
}
