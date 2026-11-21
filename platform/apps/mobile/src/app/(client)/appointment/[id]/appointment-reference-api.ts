import { apiBase } from '../../../../lib/api/api-base';

export interface AppointmentReference {
  selectedOption: string;
  originalText: string;
  isProcessed: boolean;
}

/** AI-референс візиту. Відсутній маршрут/помилка = немає референсу (не помилка екрана). */
export async function fetchAppointmentReference(id: string): Promise<AppointmentReference | null> {
  try {
    const response = await fetch(
      `${apiBase()}/booking/appointments/${encodeURIComponent(id)}/reference`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<AppointmentReference> | null;
    if (!body) return null;
    return {
      selectedOption: body.selectedOption ?? '—',
      originalText: body.originalText ?? '—',
      isProcessed: body.isProcessed ?? false,
    };
  } catch {
    return null;
  }
}
