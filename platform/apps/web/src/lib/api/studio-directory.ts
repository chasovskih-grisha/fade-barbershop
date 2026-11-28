// Довідник по студіях (T-4852a): GET /booking/barbers/:locationId приймає саме
// locationId, тож сторінка питає кожну активну студію, а не першу. Людина з
// двома призначеннями — одна картка, яка називає обидві студії; порожня студія
// не дає блоку; збій будь-якого запиту — помилка, а не неповний довідник.
// Профіль (T-4861a) шукає людину тим самим обходом, тому він знаходить майстра
// будь-якої студії, а не лише першої, і віддає призначення з кодом локації.

import { loadList } from './http';
import { empty, failed, notFound, ok, type LoadableItem, type LoadableList } from './loadable';
import { getLocations } from './locations';
import { listedBarbers, mapBarber } from './barber-visibility';
import type { Barber, BarberDto } from './staff';

/** Один блок довідника — студія та її люди (T-4852a). */
export interface StudioRoster {
  code: string;
  name: string;
  city: string | null;
  barbers: Barber[];
}

async function loadStudios(keepInactive: boolean): Promise<LoadableList<StudioRoster>> {
  const locations = await getLocations();
  if (locations.state === 'error') return failed(locations.message);
  if (locations.state !== 'ok') return empty();

  const replies = await Promise.all(
    locations.data.map((location) =>
      loadList<BarberDto>(`/booking/barbers/${encodeURIComponent(location.id)}`)
    )
  );
  const broken = replies.find((reply) => reply.state === 'error');
  if (broken && broken.state === 'error') return failed(broken.message);

  const studiosOf = new Map<string, StudioRoster[]>();
  const rostered = locations.data.map((location, index) => {
    const reply = replies[index];
    const people = reply && reply.state === 'ok'
      ? reply.data.filter((dto) => !dto.any && dto.id).map(mapBarber)
      : [];
    const barbers = keepInactive ? people : listedBarbers(people);
    for (const barber of barbers) {
      const studio: StudioRoster = {
        code: location.code,
        name: location.name,
        city: location.addressParts?.city ?? null,
        barbers: [],
      };
      studiosOf.set(barber.id, [...(studiosOf.get(barber.id) ?? []), studio]);
    }
    return { location, barbers };
  });

  const seen = new Set<string>();
  const grouped: StudioRoster[] = rostered
    .map(({ location, barbers }) => {
      const fresh = barbers.filter((barber) => !seen.has(barber.id));
      for (const barber of fresh) seen.add(barber.id);
      return {
        code: location.code,
        name: location.name,
        city: location.addressParts?.city ?? null,
        barbers: fresh.map((barber) => ({
          ...barber,
          studios: (studiosOf.get(barber.id) ?? []).map(({ code, name }) => ({ code, name })),
        })),
      };
    })
    .filter((roster) => roster.barbers.length > 0);
  return grouped.length === 0 ? empty() : ok(grouped);
}

export async function getBarbersByStudio(): Promise<LoadableList<StudioRoster>> {
  return loadStudios(false);
}

/** Профіль (T-4861a): майстер будь-якої студії, включно з вимкненим — сторінка
 * сама пояснює, чому запис недоступний (T-4865a). */
export async function getBarberAcrossStudios(slug: string): Promise<LoadableItem<Barber>> {
  const result = await loadStudios(true);
  if (result.state !== 'ok') {
    return result.state === 'error' ? failed(result.message) : notFound();
  }
  const barber = result.data
    .flatMap((roster) => roster.barbers)
    .find((person) => person.slug === slug || person.id === slug);
  return barber ? ok(barber) : notFound();
}
