// Розбір підмножини markdown у блоки статті (T-2300a). Домен віддає блоки, а не
// HTML: клієнти малюють структуру, а не виконують розмітку. Синтаксис навмисно
// вузький — абзац, h2/h3, список, цитата, зображення з обов'язковим alt; сирий
// HTML, h1 і небезпечні посилання — помилка публікації, а не «тихо почистити».

import {
  at,
  assertInline,
  isBlockStart,
  LIST_ITEM,
  parseHeading,
  parseImage,
  QUOTE,
  RAW_HTML,
  InvalidArticleBodyError,
} from './article-inline';

export { InvalidArticleBodyError } from './article-inline';

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string; caption: string | null };

interface Read {
  block: ArticleBlock;
  next: number;
}

function readList(lines: string[], start: number): Read {
  const items: string[] = [];
  let index = start;
  while (index < lines.length) {
    const item = LIST_ITEM.exec(at(lines, index));
    if (!item) break;
    assertInline(item[1] ?? '');
    items.push((item[1] ?? '').trim());
    index += 1;
  }
  return { block: { type: 'list', items }, next: index };
}

function readParagraph(lines: string[], start: number): Read {
  const parts: string[] = [];
  let index = start;
  while (
    index < lines.length &&
    at(lines, index).trim().length > 0 &&
    !isBlockStart(at(lines, index))
  ) {
    assertInline(at(lines, index));
    parts.push(at(lines, index).trim());
    index += 1;
  }
  return { block: { type: 'paragraph', text: parts.join(' ') }, next: index };
}

function readBlock(lines: string[], index: number): Read {
  const line = at(lines, index).trim();
  if (RAW_HTML.test(line)) throw new InvalidArticleBodyError('Сирий HTML у тексті заборонений');
  const image = parseImage(line);
  if (image) return { block: { type: 'image', ...image }, next: index + 1 };
  const heading = parseHeading(line);
  if (heading) return { block: { type: 'heading', ...heading }, next: index + 1 };
  if (LIST_ITEM.test(line)) return readList(lines, index);
  const quote = QUOTE.exec(line);
  if (quote) {
    assertInline(quote[1] ?? '');
    return { block: { type: 'quote', text: (quote[1] ?? '').trim() }, next: index + 1 };
  }
  return readParagraph(lines, index);
}

/** Розбирає тіло статті у блоки; порожні рядки розділяють блоки. */
export function parseArticleBody(source: string): ArticleBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: ArticleBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    if (at(lines, index).trim().length === 0) {
      index += 1;
      continue;
    }
    const { block, next } = readBlock(lines, index);
    blocks.push(block);
    index = next;
  }
  return blocks;
}
