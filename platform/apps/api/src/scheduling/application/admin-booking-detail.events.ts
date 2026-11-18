// Словник подій життєвого циклу візиту для адмін-деталей: підпис типу outbox
// і людські рядки деталей (час перенесення, причина скасування, коментар).
// Джерело типів — domain/appointment.events.ts, підписи — мова інтерфейсу.

export const EVENT_LABELS: Record<string, string> = {
  'scheduling.appointment.booked': 'Записано',
  'scheduling.appointment.confirmed': 'Підтверджено',
  'scheduling.appointment.started': 'Візит почато',
  'scheduling.appointment.completed': 'Візит завершено',
  'scheduling.appointment.cancelled': 'Скасовано',
  'scheduling.appointment.no_showed': 'Не з’явився',
  'scheduling.appointment.rescheduled': 'Перенесено',
  'scheduling.appointment.reference_changed': 'Референс/коментар змінено',
};

type Payload = Record<string, unknown>;

const text = (payload: Payload, key: string): string | null => {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

/** Актор події: роль + id (у адмінці без «імені» — лише джерело зміни). */
export function eventActor(payload: Payload): string | null {
  const role = text(payload, 'actorRole');
  const id = text(payload, 'actorId');
  if (!role && !id) return null;
  return [role, id].filter(Boolean).join(' · ');
}

/** Деталі події людською мовою: ресайзл — «було → стало», референс — коментар. */
export function eventDetails(type: string, payload: Payload): string[] {
  const reason = text(payload, 'reason');
  const comment = text(payload, 'comment');
  if (type === 'scheduling.appointment.rescheduled') {
    const was = [text(payload, 'oldStart'), text(payload, 'oldEnd')].filter(Boolean).join('–');
    const now = [text(payload, 'newStart'), text(payload, 'newEnd')].filter(Boolean).join('–');
    return was || now ? [`${was || '—'} → ${now || '—'}`] : [];
  }
  if (type === 'scheduling.appointment.booked') {
    const span = [text(payload, 'start'), text(payload, 'end')].filter(Boolean).join('–');
    return span ? [`Час ${span}`] : [];
  }
  if (!(type in EVENT_LABELS)) return [];
  return [reason, comment].filter((value): value is string => Boolean(value));
}

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}
