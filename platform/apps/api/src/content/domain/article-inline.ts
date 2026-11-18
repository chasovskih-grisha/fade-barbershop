// Лінійні правила тіла статті (T-2300a): посилання лише https:// або шлях
// сайту, сирий HTML заборонений, зображення — з обов'язковим alt. Синтаксис
// розмітки (regex) теж живе тут, щоб `article-body.ts` лишався у межах LOC.

export class InvalidArticleBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArticleBodyError';
  }
}

export const RAW_HTML = /<[a-z!/]/i;
export const IMAGE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
export const LINK = /\[[^\]]+\]\(([^)\s]+)\)/g;
export const HEADING = /^(#{1,6})\s+(.*)$/;
export const LIST_ITEM = /^[-*]\s+(.*)$/;
export const QUOTE = /^>\s?(.*)$/;

export function at(lines: string[], index: number): string {
  return lines[index] ?? '';
}

export function isBlockStart(line: string): boolean {
  return HEADING.test(line) || LIST_ITEM.test(line) || QUOTE.test(line) || IMAGE.test(line);
}

function assertUrl(url: string): void {
  if (url.startsWith('https://') || url.startsWith('/')) return;
  throw new InvalidArticleBodyError(`Посилання лише https:// або шлях сайту: ${url}`);
}

export function assertInline(text: string): void {
  if (RAW_HTML.test(text)) throw new InvalidArticleBodyError('Сирий HTML у тексті заборонений');
  for (const match of text.matchAll(LINK)) assertUrl(match[1] ?? '');
}

export function parseImage(
  line: string
): { src: string; alt: string; caption: string | null } | null {
  const match = IMAGE.exec(line);
  if (!match) return null;
  const alt = (match[1] ?? '').trim();
  if (alt.length === 0)
    throw new InvalidArticleBodyError('Зображення без alt публікувати заборонено');
  assertUrl(match[2] ?? '');
  return { src: match[2] ?? '', alt, caption: match[3]?.trim() || null };
}

export function parseHeading(line: string): { level: 2 | 3; text: string } | null {
  const match = HEADING.exec(line);
  if (!match) return null;
  const level = (match[1] ?? '').length;
  if (level < 2 || level > 3)
    throw new InvalidArticleBodyError('Дозволені лише заголовки рівня 2–3');
  assertInline(match[2] ?? '');
  return { level: level as 2 | 3, text: (match[2] ?? '').trim() };
}
