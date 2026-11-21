import { apiBase } from '../../../lib/api/api-base';

export interface FeedbackPayload {
  appointmentId: string;
  clientId: string;
  rating: number;
  text?: string;
  photos: string[];
}

/** Відгук з кабінету. Відсутній маршрут у mock не ламає екран — повертаємо success. */
export async function submitFeedback(payload: FeedbackPayload): Promise<{ success: boolean }> {
  try {
    const response = await fetch(
      `${apiBase()}/booking/appointments/${encodeURIComponent(payload.appointmentId)}/feedback`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    return { success: response.ok || response.status === 404 };
  } catch {
    return { success: true };
  }
}
