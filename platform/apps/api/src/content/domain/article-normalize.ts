/** URL-безпечний slug: нижній регістр, дефіси, без пробілів і крайніх символів. */
export function normalizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Теги: без порожніх, унікальні, у стабільному порядку (список у UI не «стрибає»). */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Map<string, string>();
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase();
    if (clean.length > 0 && !seen.has(clean)) seen.set(clean, clean);
  }
  return [...seen.values()].sort();
}
