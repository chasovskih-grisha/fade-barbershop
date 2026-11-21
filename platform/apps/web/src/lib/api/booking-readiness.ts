// Готовність сайту до запису (T-4614e): до відкриття першої локації каталог
// порожній, і CTA «Записатися» веде у флоу, який неможливо завершити.
// Закриваємо запис лише коли каталог **підтверджено** порожній: збій API —
// це не «ми зачинені», сайт не має виглядати закритим через хвилинну помилку.

import type { LoadableList } from './loadable';

export function isBookingOpen(locations: LoadableList<unknown>): boolean {
  return locations.state !== 'empty';
}
