// Liquid-рендер листів. Файли шаблонів — вміст продукту, не зовнішня система,
// але читання диска й шлях у dist (tsc і webpack) живуть тут, не в use case.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Liquid, type LiquidOptions } from 'liquidjs';
import { emailLogo } from '../application/primitives/email-logo';
import { emailTokens } from '../application/primitives/email-tokens';

export type EmailTemplatePart = 'subject' | 'text' | 'html';

const PART_FILE: Record<EmailTemplatePart, (name: string) => string> = {
  subject: (name) => `${name}/subject.liquid`,
  text: (name) => `${name}/body.txt.liquid`,
  html: (name) => `${name}/body.html.liquid`,
};

const MARKER = 'layouts/letter.liquid';

/** tsc кладе рендерер у dist/notifications/infrastructure, webpack — бандл у dist/. */
export function resolveTemplatesRoot(startDir: string): string {
  const candidates = [
    path.resolve(startDir, '../templates'),
    path.resolve(startDir, 'notifications/templates'),
    path.resolve(startDir, 'src/notifications/templates'),
  ];
  const found = candidates.find((dir) => existsSync(path.join(dir, MARKER)));
  if (!found) {
    throw new Error(`Email templates not found. Looked in:\n${candidates.join('\n')}`);
  }
  return found;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let htmlEngine: Liquid | undefined;
let textEngine: Liquid | undefined;

function engineOptions(root: string): LiquidOptions {
  return {
    root,
    extname: '.liquid',
    cache: true,
    strictVariables: true,
    strictFilters: true,
    lenientIf: true,
    ownPropertyOnly: true,
    relativeReference: false,
    // Токени й знак доступні і в layout, і в partials: `render` ізолює скоуп,
    // тому дані рендера туди не доходять, а globals — доходять (T-4611b/c).
    globals: { email: emailTokens(), logoHtml: emailLogo('milk') },
  };
}

function engines(): { html: Liquid; text: Liquid } {
  if (!htmlEngine || !textEngine) {
    const root = resolveTemplatesRoot(__dirname);
    const shared = engineOptions(root);
    htmlEngine = new Liquid({ ...shared, outputEscape: escapeHtml });
    textEngine = new Liquid(shared);
  }
  return { html: htmlEngine, text: textEngine };
}

export function renderEmailTemplate(
  name: string,
  part: EmailTemplatePart,
  data: Record<string, unknown>
): string {
  const file = PART_FILE[part](name);
  const engine = part === 'html' ? engines().html : engines().text;
  // Токени й знак інжектуються кожному листу: шаблон не тримає власних
  // кольорів/розмірів і не будує шапку вручну (T-4611b/c).
  const view = {
    ...data,
    email: emailTokens(),
    logoHtml: part === 'html' ? emailLogo('milk') : '',
  };
  try {
    return String(engine.renderFileSync(file, view)).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Email template ${name}/${part} failed: ${message}`);
  }
}
