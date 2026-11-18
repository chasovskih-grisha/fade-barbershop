'use client';

// GeoLocationBanner — спільний блок стану геолокації для списків локацій
// (флоу запису + /locations): повідомлення про відмову/недоступність,
// місто після зворотного геокодування, позначка сортування за відстанню.
// Тексти — з каталогу `states` (T-4612b).

import { Badge, Button } from '@fade/ui';
import { useTranslations } from 'next-intl';
import type { GeoStatus } from '../hooks/useGeolocation';

interface Props {
  city: string | null;
  sortedByDistance: boolean;
  status: GeoStatus;
  onRetry: () => void;
  onClear: () => void;
}

const STATUS_KEYS: Partial<Record<GeoStatus, string>> = {
  denied: 'geoDenied',
  unavailable: 'geoUnavailable',
  timeout: 'geoUnavailable',
};

const RETRYABLE: ReadonlySet<GeoStatus> = new Set(['denied', 'unavailable', 'timeout']);

export default function GeoLocationBanner({
  city,
  sortedByDistance,
  status,
  onRetry,
  onClear,
}: Props) {
  const t = useTranslations('states');
  const key = STATUS_KEYS[status];
  const message = key ? t(key) : undefined;
  const canRetry = RETRYABLE.has(status);
  if (!message && !city && !sortedByDistance) return null;

  return (
    <div className="flex flex-col gap-2" role="status">
      {message && (
        <div className="flex items-center gap-2 text-sm text-fg-secondary">
          <span>{message}</span>
          {canRetry && (
            <Button variant="ghost" onClick={onRetry}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}
      {city && (
        <div className="flex items-center gap-2">
          <Badge tone="info">{t('yourCity', { city })}</Badge>
          <Button variant="ghost" onClick={onClear}>
            {t('reset')}
          </Button>
        </div>
      )}
      {sortedByDistance && (
        <p className="text-sm text-fg-secondary">
          {t('nearestFirst')}{' '}
          <button type="button" className="underline" onClick={onClear}>
            {t('showAll')}
          </button>
        </p>
      )}
    </div>
  );
}
