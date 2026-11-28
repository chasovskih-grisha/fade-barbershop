import type { Location } from '@/lib/api/locations';
import { LocationCard } from './LocationCard';

// T-4821a: список групується за `addressParts.city`, у порядку відповіді API.
// Локації без міста — один хвіст без вигаданого підпису: місто не підставляємо
// ні з коду, ні з «центру Києва».
// T-4823: це список місць, тож `ul`/`li` — по одному елементу на студію.

export interface CityGroup {
  city: string | null;
  locations: Location[];
}

export function groupByCity(locations: Location[]): CityGroup[] {
  const named: CityGroup[] = [];
  const unknown: Location[] = [];

  for (const location of locations) {
    const city = location.addressParts?.city?.trim() || null;
    if (!city) {
      unknown.push(location);
      continue;
    }
    const group = named.find((item) => item.city === city);
    if (group) group.locations.push(location);
    else named.push({ city, locations: [location] });
  }

  return unknown.length > 0 ? [...named, { city: null, locations: unknown }] : named;
}

export function LocationCityGroups({
  locations,
  selectedCode = null,
  onSelect,
}: {
  locations: Location[];
  selectedCode?: string | null;
  onSelect?: ((code: string) => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-12">
      {groupByCity(locations).map((group) => (
        <section key={group.city ?? 'unknown'} className="flex flex-col gap-8">
          {group.city && <h2 className="font-display text-h3 font-bold text-fg">{group.city}</h2>}
          <ul className="grid grid-cols-1 gap-8 list-none p-0 m-0">
            {group.locations.map((location) => (
              <li key={location.id} className="flex">
                <LocationCard
                  location={location}
                  selected={selectedCode === location.code}
                  onShowOnMap={onSelect}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
