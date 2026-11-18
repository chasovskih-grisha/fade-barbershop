// Спільні e2e-фікстури телефонів: валідна генерація (identity валідує
// рівно 12 цифр при читанні). Єдине джерело правди — сюїти більше не
// reintroduce невалідних номерів.

import { uuidv7 } from '@fade/domain-shared';

/** Валідний номер identity (рівно 12 цифр: 380 + 9). Унікальність: 7 цифр часу
 * (між воркерами) + лічильник викликів (усередині сюїти навіть в одну мс —
 * урок GWT-фіксстур: %100 від uuid колізував) + 1 цифра uuid (пересторога). */
let phoneSeq = 0;
// prettier-ignore
export function testPhone(): string {
  return `+380${String(Date.now() % 10000000).padStart(7, '0')}${String((phoneSeq += 1) % 10)}${String(parseInt(uuidv7().slice(-1), 16) % 10)}`;
}
