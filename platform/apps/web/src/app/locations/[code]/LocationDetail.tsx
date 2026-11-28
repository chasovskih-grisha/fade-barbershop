import Image from 'next/image';
import { Card } from '@fade/ui';
import type { Location } from '@/lib/api/locations';
import { ActionLink } from '@/app/components/ActionLink';
import { LocationLogo } from '@/app/components/shell/LocationLogo';
import { LocationBreadcrumb } from '../LocationBreadcrumb';
import { LocationChairLine } from '../LocationChairLine';
import LocationHours from './LocationHours';
import LocationChannels from './LocationChannels';
import { LocationPhoneLink } from './LocationPhoneLink';
import LocationGallery from './LocationGallery';
import { LocationDirections } from './LocationDirections';
import { LocationBrandImpact } from './LocationBrandImpact';
import { LocationShare } from './LocationShare';

// T-4831: студія — один план візиту, а не колонка `max-w-3xl`. Порядок
// регіонів фіксований: герой → дії → години → контакти → (майстри, ціни —
// коли API їх віддасть) → як дійти → галерея. Герой бере перше фото галереї;
// без фото жодного плейсхолдера. Кнопка запису тримається на екрані, поки
// решта гортається, — лише до широкого брейкпойнта.
export function LocationDetail({ location }: { location: Location }) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=17/${location.lat}/${location.lng}`;
  const cover = [...location.photos].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const city = location.addressParts?.city?.trim();

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-10 md:py-16">
      <section data-section="hero" className="flex flex-col gap-4">
        <LocationBreadcrumb current={location.name} />
        {cover ? (
          <div
            data-testid="location-hero-photo"
            className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-interactive"
          >
            <Image
              src={cover.url}
              alt={cover.caption ?? location.name}
              fill
              sizes="(max-width: 768px) 100vw, 1100px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-end gap-4">
          <LocationLogo logo={location.logo} name={location.name} size="hero" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-h2">{location.name}</h1>
            <p className="text-bodyLg text-fg-secondary">
              {location.address}
              {city ? `, ${city}` : ''}
            </p>
          </div>
        </div>
      </section>

      <div
        data-section="actions"
        className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
      >
        <LocationPhoneLink phone={location.phone} channels={location.channels} />
        <ActionLink href="/booking">Записатися</ActionLink>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-body-s underline decoration-fg-secondary underline-offset-4 hover:decoration-fg"
        >
          Показати на карті <span aria-hidden="true">↗</span>
        </a>
        <LocationShare name={location.name} code={location.code} />
      </div>

      <div data-section="hours">
        <Card className="p-4">
          <LocationHours hours={location.hours} />
        </Card>
      </div>

      <div data-section="contacts" className="flex flex-col gap-4">
        <Card className="p-4">
          <LocationChannels channels={location.channels} />
        </Card>
        <LocationChairLine chairs={location.chairs} />
      </div>

      <div data-section="directions">
        <LocationDirections address={location.address} lat={location.lat} lng={location.lng} />
      </div>

      {location.photos.length > 0 ? (
        <div data-section="gallery">
          <LocationGallery photos={location.photos} />
        </div>
      ) : null}

      <LocationBrandImpact name={location.name} />
    </div>
  );
}
