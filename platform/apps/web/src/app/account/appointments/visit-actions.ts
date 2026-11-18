import { clientCabinetAnalytics } from '@/lib/analytics';

export async function runVisitAction(action: () => Promise<void>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Не вдалося виконати дію';
  }
}

export function trackAppointmentRescheduled(bookingId: string) {
  clientCabinetAnalytics.appointmentRescheduled(bookingId);
}

export function trackAppointmentCancelled(bookingId: string) {
  clientCabinetAnalytics.appointmentCancelled(bookingId);
}

export function trackReferenceUpdated(bookingId: string) {
  clientCabinetAnalytics.referenceUpdated(bookingId);
}

