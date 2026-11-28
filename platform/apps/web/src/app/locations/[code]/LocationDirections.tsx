import { Card } from '@fade/ui';

// T-4835a: напрямки більше не вигадують метро, парковку й каву. Лишається те,
// що є в записі: адреса, координати, одна точка на карті OpenStreetMap і
// посилання в карти. Якщо карта не намалювалась, адреса й посилання стоять.

export function mapLink(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

export function mapEmbed(lat: number, lng: number): string {
  const delta = 0.004;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function LocationDirections({
  address,
  lat,
  lng,
}: {
  address: string;
  lat: number;
  lng: number;
}) {
  return (
    <Card className="flex flex-col gap-4 border-border bg-surface-raised p-5">
      <h3 className="font-semibold text-h5">Адреса та карта</h3>
      <p className="text-body text-fg-secondary">{address}</p>
      <div className="relative h-56 w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-interactive">
        <iframe
          title={`Карта: ${address}`}
          src={mapEmbed(lat, lng)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0 [filter:invert(0.92)_hue-rotate(180deg)]"
        />
      </div>
      <a
        href={mapLink(lat, lng)}
        className="text-body font-medium text-accent underline"
        target="_blank"
        rel="noreferrer noopener"
      >
        Відкрити в картах
      </a>
    </Card>
  );
}
