// Правила показу звичної локації і барбера в застосунку (T-4725c). Ті самі, що
// на сайті: «Не обрано» — вибір клієнта, зниклий id — «Більше не доступно».

export const EMPTY_CHOICE_LABEL = 'Не обрано';
export const UNAVAILABLE_CHOICE_LABEL = 'Більше не доступно';

export interface UsualChairChoice {
  locationId: string | null;
  barberId: string | null;
}

export interface ChairOption {
  id: string;
  name: string;
}

export const EMPTY_CHOICE: UsualChairChoice = { locationId: null, barberId: null };

export function normalizeChoice(choice: UsualChairChoice | null | undefined): UsualChairChoice {
  return {
    locationId: choice?.locationId ?? null,
    barberId: choice?.barberId ?? null,
  };
}

export function toOptions(rows: { id: string; name: string }[]): ChairOption[] {
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export function hasOption(options: ChairOption[], id: string | null): boolean {
  if (!id) return false;
  return options.some((option) => option.id === id);
}

/** Збережений id, якого немає в довіднику: локацію закрили або барбер пішов. */
export function isUnavailable(options: ChairOption[], id: string | null): boolean {
  return id !== null && !hasOption(options, id);
}

export function sameChoice(a: UsualChairChoice, b: UsualChairChoice): boolean {
  return a.locationId === b.locationId && a.barberId === b.barberId;
}

export function optionName(options: ChairOption[], id: string | null): string | null {
  return options.find((option) => option.id === id)?.name ?? null;
}
