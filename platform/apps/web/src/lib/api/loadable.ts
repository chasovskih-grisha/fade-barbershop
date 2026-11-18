// Стани асинхронного блоку (T-4513, ux-guidelines §1): помилка й порожня
// відповідь — різні речі, тож результат типізований, а не «масив або порожній
// масив».
//   ok       — дані є;
//   empty    — запит успішний, але список порожній (EmptyState);
//   error    — мережа/5xx (AlertBanner + «Спробувати ще раз»);
//   notFound — 404 (для детальних сторінок: 404 або явний стан).
// Сторінка ніколи не падає на помилці API — вона показує стан.
// Список і деталька розведені: в одному елементі стану «порожньо» не буває.

export type OkState<T> = { state: 'ok'; data: T };
export type EmptyState = { state: 'empty' };
export type FailedState = { state: 'error'; message: string };
export type NotFoundState = { state: 'notFound' };

export type LoadableList<T> = OkState<T[]> | EmptyState | FailedState | NotFoundState;
export type LoadableItem<T> = OkState<T> | FailedState | NotFoundState;

export const ok = <T>(data: T): OkState<T> => ({ state: 'ok', data });
export const empty = (): EmptyState => ({ state: 'empty' });
export const failed = (message: string): FailedState => ({ state: 'error', message });
export const notFound = (): NotFoundState => ({ state: 'notFound' });

/** Порожній масив — це empty, а не ok з нульовим довжиною (устаткування клієнта). */
export const okList = <T>(items: T[]): LoadableList<T> =>
  items.length === 0 ? empty() : ok(items);
