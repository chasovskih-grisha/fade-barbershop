// Спільні типи й карти статусів візита (T-045): форма відповіді
// GET /admin/calendar, наступні дії за статусом і їх українські мітки.
export interface CalendarVisit {
  id: string;
  bookingId: string;
  appointmentId: string | null;
  locationId: string;
  barberId: string;
  start: string;
  end: string;
  status: string;
  serviceId: string | null;
  agreedPrice: number | null;
  partyId: string | null;
  partyRole: string | null;
  haircutReferenceId: string | null;
  /** Підписаний URL референсу з сітки (REF-ADM-01) — без окремого запиту на картку. */
  referencePhotoUrl: string | null;
  comment: string | null;
  source: string;
  clientId: string | null;
}

export type VisitAction = 'confirm' | 'start' | 'complete' | 'no-show' | 'cancel' | 'reschedule';

/** Доступні дії за статусом (правила переходів — AppointmentLifecycle, T-042). */
export const NEXT_ACTIONS: Record<string, VisitAction[]> = {
  booked: ['confirm', 'cancel', 'reschedule'],
  confirmed: ['start', 'no-show', 'cancel', 'reschedule'],
  in_progress: ['complete'],
};

export const ACTION_LABELS: Record<Exclude<VisitAction, 'reschedule'>, string> = {
  confirm: 'Підтвердити',
  start: 'Почати',
  complete: 'Завершити',
  'no-show': 'Не прийшов',
  cancel: 'Скасувати',
};

export const hhmm = (iso: string) => iso.slice(11, 16);

/** Опції фільтра статусу тулбаря (мітки з StatusPill, @fade/ui). */
// prettier-ignore
export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Усі' },
  { value: 'booked', label: 'Заброньовано' },
  { value: 'confirmed', label: 'Підтверджено' },
  { value: 'in_progress', label: 'В процесі' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Скасовано' },
  { value: 'no_show', label: 'Не прийшов' },
];

/** Порядок статусів у сортуванні — за життєвим циклом, не за алфавітом. */
// prettier-ignore
export const STATUS_ORDER: Record<string, number> = {
  booked: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: 4, no_show: 5,
};
