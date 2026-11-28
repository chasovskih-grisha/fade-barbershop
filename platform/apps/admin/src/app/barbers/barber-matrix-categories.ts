// Категорії послуг у матриці «барбер × послуга» (T-4521): тип рядка, мапінг із
// каталогу локації та групування. Винесено з barber-matrix-data.ts за LOC-гейтом.

type CatalogEntry = { id: string; name: string; category?: string };

export type MatrixService = { id: string; name: string; category?: string };

/** Категорії послуг локації; послуги без категорії — під «Без категорії». */
export const UNCATEGORIZED = 'Без категорії';

/**
 * Каталог → рядок матриці. Категорія лишається опційною: API віддає її не для всіх
 * послуг, і `exactOptionalPropertyTypes` не дозволяє покласти `undefined` у поле.
 */
export function toMatrixService(entry: CatalogEntry): MatrixService {
  const service: MatrixService = { id: entry.id, name: entry.name };
  if (entry.category) service.category = entry.category;
  return service;
}

export function categoriesOf(
  services: MatrixService[]
): Array<{ name: string; serviceIds: string[] }> {
  const groups = new Map<string, string[]>();
  for (const service of services) {
    const name = service.category?.trim() || UNCATEGORIZED;
    groups.set(name, [...(groups.get(name) ?? []), service.id]);
  }
  return [...groups.entries()]
    .map(([name, serviceIds]) => ({ name, serviceIds }))
    .sort((left, right) => left.name.localeCompare(right.name, 'uk'));
}
