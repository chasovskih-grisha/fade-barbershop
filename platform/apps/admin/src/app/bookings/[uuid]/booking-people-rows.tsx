// Рядки секції «Хто прийде»: клієнт, VIP, барбер, локація, партія.
// Окремо від картки — кожен рядок простий (complexity-гейт) і має свою
// відповідь на питання «відсутній клієнт / немає картки CRM».
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { fullDateTime, money, shortId } from './booking-format';
import type { BookingDetail } from './booking-types';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="shrink-0 text-caption text-fg-muted">{label}</dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

export function ClientRow({ client }: { client: BookingDetail['client'] }) {
  if (!client) return <Row label="Клієнт">Без клієнта</Row>;
  return (
    <Row label="Клієнт">
      {client.profileId ? (
        <Link href={`/clients/${client.profileId}`} className="text-accent-blue hover:underline">
          {client.name ?? 'Без імені'}
        </Link>
      ) : (
        (client.name ?? 'Без імені')
      )}
      {client.phone && <span className="ml-2 text-fg-muted">{`· ${client.phone}`}</span>}
    </Row>
  );
}

export function LoyaltyRow({ client }: { client: BookingDetail['client'] }) {
  if (client?.vipDiscountPercent === null || client?.vipDiscountPercent === undefined) return null;
  return (
    <Row label="VIP / візитів">
      {`${client.vipDiscountPercent}% · ${client.loyaltyVisitsCount ?? 0}`}
    </Row>
  );
}

export function BarberRow({ barber }: { barber: BookingDetail['barber'] }) {
  return (
    <Row label="Барбер">
      {barber?.name ?? '—'}
      {barber?.phone && <span className="ml-2 text-fg-muted">{`· ${barber.phone}`}</span>}
    </Row>
  );
}

export function LocationRow({ location }: { location: BookingDetail['location'] }) {
  if (!location) return <Row label="Локація">—</Row>;
  return (
    <Row label="Локація">
      <Link href={`/locations/${location.id}`} className="text-accent-blue hover:underline">
        {location.name}
      </Link>
      <span className="ml-2 text-fg-muted">{`· ${location.address}`}</span>
    </Row>
  );
}

export function PartyNote({ party }: { party: BookingDetail['party'] }) {
  if (!party) return null;
  const legs = (party.legs ?? [])
    .map((leg) => leg.barberId)
    .filter((id): id is string => Boolean(id));
  const barbers = [...new Set([...party.barberIds, ...legs])];
  return (
    <div className="mt-4 space-y-1 border-t border-line pt-3">
      <p className="text-body text-fg-muted">
        {`Партія «${party.role}»${party.mode ? `, режим ${party.mode}` : ''}`}
      </p>
      {party.date && (
        <p className="text-body text-fg-muted">{`Дата: ${fullDateTime(party.date)}`}</p>
      )}
      {barbers.length > 0 && (
        <p className="text-body text-fg-muted">{`Барбери: ${barbers.map(shortId).join(', ')}`}</p>
      )}
      {party.agreedPrice !== null && (
        <p className="text-body text-fg-muted">{`Ціна партії: ${money(party.agreedPrice)}`}</p>
      )}
    </div>
  );
}
