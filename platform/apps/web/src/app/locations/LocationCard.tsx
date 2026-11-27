import Image from 'next/image';
import Link from 'next/link';
import { Button, Card } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';
import { LocationLogo } from '@/app/components/shell/LocationLogo';
import type { Location } from '@/lib/api/locations';

import { LocationChairLine } from './LocationChairLine';
import { openNow, todayHours } from './location-today';

// Картка локації у списку (T-4822): фотографія студії + знак. Фото — перше
// за sortOrder (як у галереї деталей), із підписом як доступною назвою; без
// фото — токен-поверхня, без стокового зображення й без розтягнутого логотипа.
// T-4820: картка каже лише те, що знає запис — назва, адреса, телефон і
// сьогоднішній інтервал із `hours`; жодного рангу, вигаданих зручностей чи
// фіксованого графіка мережі.
// T-4823: сама картка веде на сторінку студії одним посиланням (накладка на
// всю площу, назва студії як доступна назва), а «Записатися» — окремий
// другорядний контрол, який веде в запис і не відкриває студію.

function coverPhoto(location: Location) {
  const [first] = [...location.photos].sort((a, b) => a.sortOrder - b.sortOrder);
  return first ?? null;
}

export function LocationCard({
  location,
  selected = false,
  onShowOnMap,
}: {
  location: Location;
  selected?: boolean;
  onShowOnMap?: ((code: string) => void) | undefined;
}) {
  const photo = coverPhoto(location);
  const now = new Date();
  const today = todayHours(location.hours, now);
  const open = openNow(location.hours, now);

  return (
    <Card
      id={`studio-card-${location.code}`}
      tabIndex={-1}
      className={`group relative flex w-full flex-col justify-between overflow-hidden p-0 border-line bg-surface shadow-md transition-all hover:border-accent hover:shadow-xl ${
        selected ? 'ring-2 ring-accent' : ''
      }`}
    >
      <Link
        href={`/locations/${location.code}`}
        aria-label={location.name}
        className="absolute inset-0 z-10 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

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
        {today && (
          <p className="text-caption text-fg-secondary">
            Сьогодні: {today}
            {open !== null && ` · ${open ? 'Відкрито зараз' : 'Зачинено'}`}
          </p>
        )}
        {location.phone && (
          <a
            href={`tel:${location.phone}`}
            className="relative z-20 w-fit text-body font-semibold text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-input"
          >
            {location.phone}
          </a>
        )}
      </div>

      <div className="relative z-20 mx-8 mb-8 flex items-center gap-3 pt-5 border-t border-line">
        <ActionLink
          href="/booking"
          variant="secondary"
          className="h-12 flex-1 text-body font-medium"
        >
          Записатися
        </ActionLink>
        {onShowOnMap && (
          <Button
            type="button"
            variant="ghost"
            aria-label={`Показати ${location.name} на карті`}
            className="h-12"
            onClick={() => onShowOnMap(location.code)}
          >
            На карті
          </Button>
        )}
      </div>
    </Card>
  );
}
