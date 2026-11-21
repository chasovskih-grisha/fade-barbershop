export interface SortableItem {
  sortOrder: number;
}

export function reorder<T extends SortableItem>(items: T[], index: number, step: -1 | 1): T[] {
  const target = index + step;
  const item = items[index];
  const other = items[target];
  if (!item || !other) return items;
  const next = [...items];
  next[index] = other;
  next[target] = item;
  return next.map((entry, position) => ({ ...entry, sortOrder: position }));
}

export function patchItem<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((entry, position) => (position === index ? { ...entry, ...patch } : entry));
}

export function appendItem<T extends SortableItem>(items: T[], item: Omit<T, 'sortOrder'>): T[] {
  return [...items, { ...item, sortOrder: items.length } as T];
}
