import { AlertBanner, Badge } from '@fade/ui';
import InactiveLocationBanner from './InactiveLocationBanner';
import type { LocationEditViewProps } from './location-edit-types';

export default function LocationHeader({
  location,
  error,
  notice,
}: Pick<LocationEditViewProps, 'location' | 'error' | 'notice'>) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h3">{location.name}</h1>
        <Badge tone={location.active ? 'success' : 'neutral'}>
          {location.active ? 'Активна' : 'Неактивна'}
        </Badge>
      </div>
      <p className="text-body text-fg-secondary">
        {location.code} · {location.address}
        {location.phone ? ` · ${location.phone}` : ''}
      </p>
      <InactiveLocationBanner active={location.active} />
      {notice ? (
        <p
          role="status"
          className={notice.tone === 'success' ? 'text-semantic-success' : 'text-fg-secondary'}
        >
          {notice.text}
        </p>
      ) : null}
      {error ? (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      ) : null}
    </>
  );
}
