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
          className="text-sm underline decoration-fg-secondary underline-offset-4 hover:decoration-fg"
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
          Зручний під&rsquo;їзд у центрі району. Місця для паркування поруч із входом. Тихий затишний простір без натовпу та черг — працює 2 крісла.
        </p>
      </Card>

      <LocationGallery photos={location.photos} />

      {/* Brand Impact & VIP Guest Experience Enhancement */}
      <Card className="p-7 flex flex-col gap-5 border-accent-blue/30 bg-gradient-to-br from-surface-raised via-surface to-accent-blue/5 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-accent-blue/15 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue font-bold text-lg" aria-hidden="true">✦</span>
          <div>
            <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">Преміум-сервіс студії {location.name}</span>
            <h3 className="font-display text-h4 font-bold text-fg">Ваш винятковий візит у деталях</h3>
          </div>
        </div>
        <p className="text-body text-fg-secondary relative z-10 leading-relaxed">
          Кожен візит до нашої камерної студії створений за стандартом Fade Atelier: абсолютна приватність, відсутність сторонніх відвідувачів, авторські напої з бару та персональна підбірка доглядової косметики.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-line/80 relative z-10">
          <div className="p-4 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-bold text-fg">☕ Craft Bar</span>
            <span className="text-caption text-fg-secondary">Крафтова кава, чай та преміум-напої</span>
          </div>
          <div className="p-4 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-bold text-fg">🔒 100% Privacy</span>
            <span className="text-caption text-fg-secondary">Тільки ви, ваш майстер та музика</span>
          </div>
          <div className="p-4 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line flex flex-col gap-1 shadow-sm">
            <span className="text-sm font-bold text-fg">✨ Hot Towel</span>
            <span className="text-caption text-fg-secondary">Класичний ритуальний компрес гарячим рушником</span>
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between flex-wrap gap-4 relative z-10">
          <span className="text-caption text-fg-muted font-medium">Бажаєте обрати конкретне крісло чи майстра?</span>
          <ActionLink href="/booking" variant="secondary" className="text-sm font-semibold">Забронювати онлайн &rarr;</ActionLink>
        </div>
      </Card>
    </div>
  );
}
