// Екранування листа (T-4611b): текст і атрибути екрануються в контексті,
// інакше лапка в імені клієнта ламає href/alt.
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Значення атрибута: ті самі правила, явна назва для читача. */
export const escapeAttribute = escapeHtml;
