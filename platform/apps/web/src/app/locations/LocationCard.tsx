import Image from 'next/image';
import { Card } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';
import { LocationLogo } from '@/app/components/shell/LocationLogo';
import type { Location } from '@/lib/api/locations';
import { todayHours } from './location-today';
import { LocationChairLine } from './LocationChairLine';

// Картка локації у списку (T-4822): фотографія студії + знак. Фото — перше
// за sortOrder (як у галереї деталей), із підписом як доступною назвою; без
// фото — токен-поверхня, без стокового зображення й без розтягнутого логотипа.
// T-4820: картка каже лише те, що знає запис — назва, адреса, телефон і
// сьогоднішній інтервал із `hours`; жодного рангу, вигаданих зручностей чи
// фіксованого графіка мережі.

function coverPhoto(location: Location) {
  const [first] = [...location.photos].sort((a, b) => a.sortOrder - b.sortOrder);
  return first ?? null;
}

export function LocationCard({ location }: { location: Location }) {
  const photo = coverPhoto(location);
  const today = todayHours(location.hours);

  return (
    <Card
      aria-label={`Локація ${location.name}`}
      className="group flex flex-col justify-between overflow-hidden p-0 border-line bg-surface shadow-md transition-all hover:border-accent hover:shadow-xl"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-sunken">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.caption ?? `Фото локації ${location.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-6 p-8">
        <LocationLogo logo={location.logo} name={location.name} />
        <h2 className="font-display text-h4 font-bold text-fg group-hover:text-accent transition-colors">
          {location.name}
        </h2>
        <p className="text-body text-fg-secondary">{location.address}</p>
        <LocationChairLine chairs={location.chairs} />
        {today && <p className="text-caption text-fg-secondary">Сьогодні: {today}</p>}
        {location.phone && (
          <a
            href={`tel:${location.phone}`}
            className="text-body font-semibold text-fg hover:underline"
          >
            {location.phone}
          </a>
        )}
      </div>

      <div className="mx-8 mb-8 flex items-center gap-3 pt-5 border-t border-line">
        <ActionLink href="/booking" className="h-12 flex-1 text-body font-semibold">
          Записатися
        </ActionLink>
        <ActionLink
          href={`/locations/${location.code}`}
          variant="secondary"
          className="h-12 flex-1 text-body font-medium"
        >
          Деталі
        </ActionLink>
      </div>
    </Card>
  );
}
