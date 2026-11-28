// Правила показу звичної локації і барбера (T-4725b). Тримаємо їх поза
// компонентом: «Не обрано» — це вибір, а не порожнеча, а id, якого вже немає
// в довіднику, показується як «Більше не доступно» і очищається.

/** Порожнє значення — реальний вибір клієнта, не «даних немає». */
export const EMPTY_CHOICE_LABEL = 'Не обрано';

/** Збережений id, якого немає в довіднику: локацію закрили або барбер пішов. */
export const UNAVAILABLE_CHOICE_LABEL = 'Більше не доступно';

export interface UsualChairChoice {
  locationId: string | null;
  barberId: string | null;
}

export interface ChairOption {
  id: string;
  name: string;
}

export interface ChairOptions {
  locations: ChairOption[];
  barbers: ChairOption[];
}

export const EMPTY_CHOICE: UsualChairChoice = { locationId: null, barberId: null };

export function hasOption(options: ChairOption[], id: string | null): boolean {
  if (!id) return false;
  return options.some((option) => option.id === id);
}

/** Збережений id, який більше не резолвиться (показуємо «Більше не доступно»). */
export function isUnavailable(options: ChairOption[], id: string | null): boolean {
  return id !== null && !hasOption(options, id);
}

export function sameChoice(a: UsualChairChoice, b: UsualChairChoice): boolean {
  return a.locationId === b.locationId && a.barberId === b.barberId;
}

/**
 * Значення селекта: збережений id лишається видимим, навіть якщо його немає в
 * довіднику — інакше браузер показав би перший пункт і зрадив вибір клієнта.
 */
export function selectedValue(options: ChairOption[], id: string | null): string {
  if (id === null) return '';
  return id;
}

/** Барбер належить локації: зміна локації не тягне барбера з іншої студії. */
export function barberBelongsTo(options: ChairOptions, barberId: string | null): boolean {
  return barberId === null || hasOption(options.barbers, barberId);
}
