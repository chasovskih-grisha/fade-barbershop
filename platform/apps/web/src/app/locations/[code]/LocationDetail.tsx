import { Card } from '@fade/ui';
import type { Location } from '@/lib/api/locations';
import { ActionLink } from '@/app/components/ActionLink';
import { LocationLogo } from '@/app/components/shell/LocationLogo';
import { LocationBreadcrumb } from '../LocationBreadcrumb';
import { LocationChairLine } from '../LocationChairLine';
import LocationHours from './LocationHours';
import LocationChannels from './LocationChannels';
import LocationGallery from './LocationGallery';
import { LocationDirections } from './LocationDirections';
import { LocationBrandImpact } from './LocationBrandImpact';

// Вміст активної локації (виділено зі сторінки, щоб page.tsx лишився лише
// вибором стану — ADR 0019 LOC). Герой, CTA запису, карта, години, крісла,
// галерея (web-screens §2).

export function LocationDetail({ location }: { location: Location }) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=17/${location.lat}/${location.lng}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <LocationBreadcrumb current={location.name} />
        <LocationLogo logo={location.logo} name={location.name} size="hero" />
        <h1 className="font-display text-h2">{location.name}</h1>
        <p className="text-bodyLg text-fg-secondary">{location.address}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <ActionLink href="/booking">Записатися</ActionLink>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-body-s underline decoration-fg-secondary underline-offset-4 hover:decoration-fg"
        >
          Показати на карті ↗
        </a>
      </div>

      <LocationChairLine chairs={location.chairs} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-4">
          <LocationChannels channels={location.channels} />
        </Card>
        <Card className="p-4">
          <LocationHours hours={location.hours} />
        </Card>
      </div>

      <LocationDirections address={location.address} />

      <Card className="p-5 flex flex-col gap-3 border-border bg-surface-raised">
        <h3 className="font-semibold text-h5">Парковка та орієнтири</h3>
        <p className="text-sm text-fg-secondary">
          Зручний під&rsquo;їзд у центрі району. Місця для паркування поруч із входом. Тихий
          затишний простір без натовпу та черг — працює 2 крісла.
        </p>
      </Card>

      <LocationGallery photos={location.photos} />

      <LocationBrandImpact name={location.name} />
    </div>
  );
}
