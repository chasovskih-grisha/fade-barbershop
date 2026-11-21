// T-2300f: стаття в застосунку показується тими самими полями, що на сайті.
// Тіло — звичайний текст з порожнім рядком між абзацами (HTML із CMS не
// виконується). Посилання «на сайт» — канонічний HTTPS-URL, не deep link.

export const CANONICAL_SITE = 'https://fade.com.ua';

export function canonicalArticleUrl(slug: string): string {
  return `${CANONICAL_SITE}/blog/${encodeURIComponent(slug)}`;
}

export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function formatArticleDate(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}
