// Секція «Хто прийде»: клієнт, барбер, локація, партія. Клієнт і локація —
// посилання на їхні картки в адмінці; відсутні довідники не ламають рядок.
'use client';

import { Card } from '@fade/ui';
import { BarberRow, ClientRow, LocationRow, LoyaltyRow, PartyNote } from './booking-people-rows';
import type { BookingDetail } from './booking-types';

export function BookingPeopleCard({ detail }: { detail: BookingDetail }) {
  return (
    <Card className="p-6">
      <h2 className="mb-3 font-display text-h4">Хто прийде</h2>
      <dl className="divide-y divide-line">
        <ClientRow client={detail.client} />
        <LoyaltyRow client={detail.client} />
        <BarberRow barber={detail.barber} />
        <LocationRow location={detail.location} />
      </dl>
      <PartyNote party={detail.party} />
    </Card>
  );
}
