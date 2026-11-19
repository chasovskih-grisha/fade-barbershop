// Черга для адмінки (T-170a: «Interface for admin panel»): групи по
// конфігураціях, статуси й ETA. Чистий домен — Prisma/HTTP не заходять.
import { estimateWaitMinutes, type WaitlistEta, type WaitlistEtaHistory } from './waitlist-eta';
import type { WaitlistConfiguration, WaitlistEntryData } from './waitlist-queue';

/** Ключ конфігурації: локація + послуга + барбер (або «Будь-який»). */
export function configurationKey(configuration: WaitlistConfiguration): string {
  return `${configuration.locationId}|${configuration.serviceId}|${configuration.barberId ?? 'any'}`;
}

export interface WaitlistQueueSummary {
  configurationId: string;
  locationId: string;
  serviceId: string;
  barberId: string | null;
  waiting: number;
  offered: number;
  paused: number;
  /** Скільки чекає найстаріша заявка (хвилини). */
  oldestWaitingMinutes: number;
  /** ETA для останнього в цій черзі; `null` — нікому не пропонувати. */
  eta: WaitlistEta | null;
}

const minutesBetween = (from: Date, to: Date) =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));

/** Групування по конфігураціях для екрана «Лист очікування» (WTL-ADM-01). */
export function summarizeQueues(
  entries: WaitlistEntryData[],
  now: Date,
  options: { localHour: number; history?: WaitlistEtaHistory }
): WaitlistQueueSummary[] {
  const groups = new Map<string, WaitlistEntryData[]>();
  for (const entry of entries) {
    const key = configurationKey(entry.configuration);
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  const summaries: WaitlistQueueSummary[] = [];
  for (const [configurationId, group] of groups) {
    const first = group[0];
    if (!first) continue;
    const waiting = group.filter((entry) => entry.status === 'waiting');
    const offered = group.filter((entry) => entry.status === 'offered').length;
    const paused = group.filter((entry) => entry.status === 'paused').length;

    const oldestWaitingMinutes = waiting.reduce(
      (max, entry) => Math.max(max, minutesBetween(entry.waitingSince, now)),
      0
    );

    const configuration = first.configuration;
    const eta = waiting.length
      ? estimateWaitMinutes({
          position: waiting.length,
          partySize: configuration.groupSize ?? 1,
          localHour: options.localHour,
          ...(options.history === undefined ? {} : { history: options.history }),
        })
      : null;

    summaries.push({
      configurationId,
      locationId: configuration.locationId,
      serviceId: configuration.serviceId,
      barberId: configuration.barberId ?? null,
      waiting: waiting.length,
      offered,
      paused,
      oldestWaitingMinutes,
      eta,
    });
  }

  return summaries.sort((a, b) => b.waiting - a.waiting || b.oldestWaitingMinutes - a.oldestWaitingMinutes);
}

export type WaitlistEntryStatusLabel = 'чекає' | 'є пропозиція' | 'на паузі' | 'закрита';

export interface AdminWaitlistRow {
  entryId: string;
  clientId: string;
  configurationId: string;
  status: WaitlistEntryStatusLabel;
  waitingMinutes: number;
  precision: WaitlistConfiguration['precision'];
  /** Хто й чому підняв заявку вручну (T-4453), якщо було. */
  overrideReason: string | null;
}

export function statusLabel(status: WaitlistEntryData['status']): WaitlistEntryStatusLabel {
  switch (status) {
    case 'waiting':
      return 'чекає';
    case 'offered':
      return 'є пропозиція';
    case 'paused':
      return 'на паузі';
    case 'expired':
    case 'fulfilled':
      return 'закрита';
  }
}

export function adminRows(entries: WaitlistEntryData[], now: Date): AdminWaitlistRow[] {
  return entries.map((entry) => ({
    entryId: entry.id,
    clientId: entry.clientId,
    configurationId: configurationKey(entry.configuration),
    status: statusLabel(entry.status),
    waitingMinutes: minutesBetween(entry.waitingSince, now),
    precision: entry.configuration.precision,
    overrideReason: entry.override?.reason ?? null,
  }));
}
