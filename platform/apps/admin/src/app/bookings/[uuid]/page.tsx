// Деталі візиту в адмінці (/bookings/[uuid]): вся доступна інформація про
// запис — зведення, хто прийде, історія змін. Розкладка лише компонує секції,
// дані — у useBookingDetail (LOC-гейт ADR 0019).
'use client';

import { AlertBanner, Skeleton } from '@fade/ui';
import { BookingHeader } from './BookingHeader';
import { BookingHistoryCard } from './BookingHistoryCard';
import { BookingPeopleCard } from './BookingPeopleCard';
import { BookingReferenceCard } from './BookingReferenceCard';
import { BookingSummaryCard } from './BookingSummaryCard';
import { useBookingDetail } from './useBookingDetail';

export default function BookingDetailPage() {
  const { detail, loading, error } = useBookingDetail();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton variant="rect" className="h-12 w-72" />
        <Skeleton variant="rect" className="h-64" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <AlertBanner tone="error" title="Помилка">
        {error ?? 'Візит не знайдено'}
      </AlertBanner>
    );
  }

  return (
    <div>
      <BookingHeader detail={detail} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BookingSummaryCard detail={detail} />
        <BookingReferenceCard detail={detail} />
        <BookingPeopleCard detail={detail} />
        <div className="lg:col-span-2">
          <BookingHistoryCard detail={detail} />
        </div>
      </div>
    </div>
  );
}
