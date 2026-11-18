// Тести правила no-phantom-classes (T-004).
//
// Правило шукає класи, яким у дизайн-системі немає токена. Чотири межі, які легко
// зламати, тому вони закріплені тут:
//   1) ядрові утиліти Tailwind без токен-словника (вирівнювання й перенос тексту,
//      сторони/стилі меж, напрямки divide, фон і його шари, `line-clamp-*`,
//      ключові ширини, насиченість і дефолтні родини шрифтів) НЕ флагуються —
//      мігрувати їм нікуди;
//   2) числові величини (border-2, ring-2, w-1/2, max-w-0) і довільні значення
//      Tailwind у квадратних дужках (text-[11px], max-w-[13rem]) — теж;
//   3) глобальні CSS-ключові слова й ключові кольори (none, auto, inherit,
//      unset, revert-layer, transparent, current, black, white) — теж;
//   4) токени дизайн-системи проходять у ВСІХ групах пресету, а не лише в тих,
//      які випадково мали окрему гілку коду: `bg-accent-blue` (вкладений колір),
//      `divide-line`, `rounded-micro`, `max-w-sm`, `text-semantic-success`.
//
// Запуск: `pnpm --filter eslint-plugin-no-phantom-classes test` (node --test).
// Якщо пресет токенів не знайдено, правило тихо нічого не робить — тож перший
// тест вимагає, щоб відоме порушення було зловлене: це доказ, що пресет завантажено.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const plugin = require('./index.js');

const linter = new Linter();
linter.defineRule('phantom', plugin.rules['no-phantom-classes']);

const OPTIONS = {
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  rules: { phantom: 'error' },
};

/** Які класи правило вважає фантомними. */
function flagged(classes) {
  const code = `export const Probe = () => <div className="${classes.join(' ')}" />;`;
  const messages = linter.verify(code, OPTIONS);
  const tokens = messages.map((m) => (m.message.match(/"([^"]+)"/) ?? [])[1]);
  return new Set(tokens.filter(Boolean));
}

test('пресет токенів завантажено — порушення шкали ловиться', () => {
  // `text-body-lg`: у tokens.json ключ camelCase (`bodyLg`), кебаб-класу немає.
  assert.deepEqual([...flagged(['text-body-lg'])], ['text-body-lg']);
});

test('ядрові утиліти без токен-словника не флагуються', () => {
  const core = [
    // вирівнювання й перенос тексту
    'text-center',
    'text-left',
    'text-right',
    'text-balance',
    'text-ellipsis',
    'truncate',
    // сторони, товщина й стилі меж
    'border-t',
    'border-b',
    'border-r',
    'border-2',
    'border-t-2',
    'border-collapse',
    'border-t-transparent',
    'border-spacing-x-2',
    'last:border-0',
    // divide
    'divide-y',
    'divide-x',
    'divide-dashed',
    'divide-x-reverse',
    // ring / outline / focus-visible
    'ring-2',
    'ring-inset',
    'ring-offset-2',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'focus-visible:outline-none',
    'outline-none',
    'outline-dashed',
    'outline-offset-2',
    // radius без величини й логічні сторони
    'rounded',
    'rounded-br',
    'rounded-s',
    'rounded-ss',
    // фон: attachment, clip, origin, position, repeat, size, gradient
    'bg-cover',
    'bg-contain',
    'bg-center',
    'bg-top-left',
    'bg-fixed',
    'bg-local',
    'bg-scroll',
    'bg-repeat',
    'bg-no-repeat',
    'bg-clip-text',
    'bg-origin-border',
    'bg-gradient-to-b',
    'bg-linear-to-r',
    'bg-blend-overlay',
    'bg-none',
    // насиченість і дефолтні родини
    'font-medium',
    'font-semibold',
    'font-bold',
    'font-mono',
    // утиліти, яких словник токенів не описує взагалі
    'line-clamp-2',
    'sr-only',
    'tabular-nums',
    'tracking-wider',
    'grid-cols-7',
    'md:hidden',
    'aspect-square',
  ];
  assert.deepEqual([...flagged(core)], []);
});

test('числові величини й довільні значення Tailwind не флагуються', () => {
  const numeric = [
    'border-2',
    'ring-2',
    'mt-4',
    'w-1/2',
    'min-h-24',
    'max-w-0',
    'w-px',
    '-mb-px',
    'disabled:opacity-50',
    'text-[11px]',
    'max-w-[13rem]',
    'border-[3px]',
    'ring-[3px]',
    'outline-[2px]',
    'font-[600]',
    'rounded-[6px]',
    'tracking-[0.2em]',
    'focus-visible:ring-[3px]',
  ];
  assert.deepEqual([...flagged(numeric)], []);
});

test('глобальні CSS-ключові слова й ключові кольори не флагуються', () => {
  const keywords = [
    'bg-transparent',
    'text-transparent',
    'border-transparent',
    'text-current',
    'ring-current',
    'divide-current',
    'text-inherit',
    'text-unset',
    'bg-revert-layer',
    'outline-none',
    'max-w-none',
    'max-w-full',
    'max-w-fit',
    'max-w-prose',
    'max-w-screen-lg',
    'bg-black',
    'text-white',
    'bg-black/50',
    'placeholder-transparent',
  ];
  assert.deepEqual([...flagged(keywords)], []);
});

test('токени дизайн-системи проходять — у кожній групі пресету', () => {
  const tokens = [
    'text-body',
    'text-bodyLg',
    'text-caption',
    'text-h4',
    'text-display',
    'text-fg',
    'text-fg-secondary',
    'text-fg-muted',
    'text-semantic-danger',
    'text-semantic-success',
    'text-accent-blue',
    'bg-surface-base',
    'bg-surface-sunken',
    'bg-accent-blue',
    'bg-accent-blue/80',
    'bg-surface-base/95',
    'bg-ink/60',
    'bg-interactive',
    'hover:bg-interactive-hover',
    'divide-line',
    'border-border',
    'border-line',
    'border-line-strong',
    'border-accent-blue/40',
    'border-t-line',
    'ring-accent-blue',
    'ring-offset-surface-base',
    'outline-accent-blue',
    'placeholder-fg-muted',
    'accent-accent-blue',
    'font-display',
    'font-text',
    'rounded-input',
    'rounded-card',
    'rounded-pill',
    'rounded-micro',
    'rounded-t-card',
    // compat-токени з tokens.json (radiusMd/radiusLg/radiusFull, grid max*)
    'rounded-md',
    'rounded-lg',
    'rounded-full',
    'max-w-container',
    'max-w-sm',
    'max-w-3xl',
    'leading-snug',
    'leading-tight',
    'p-4',
    'gap-2',
  ];
  assert.deepEqual([...flagged(tokens)], []);
});

test('варіанти знімаються узагальнено, а не списком', () => {
  const variants = [
    'hover:text-center',
    'sm:hover:ring-2',
    'aria-[sort=ascending]:text-right',
    'supports-[display:grid]:flex',
    '[&>*]:p-2',
    'group-hover:bg-cover',
    'dark:max-w-none',
    'md:divide-x-reverse',
  ];
  assert.deepEqual([...flagged(variants)], []);
});

test('класи без токена лишаються фантомними', () => {
  const phantom = [
    'text-body-lg',
    'text-fg-primary',
    'text-h7',
    'text-body-xll',
    'bg-red-500',
    'max-w-9xl',
    'rounded-xxl',
    'ring-accent-bluer',
    'border-linee',
  ];
  assert.deepEqual([...flagged(phantom)].sort(), [...phantom].sort());
});

test('спадкові класи зі списку винятків не ламають гейт (і лишаються ним покриті)', () => {
  // Список — тимчасова компенсація прогалин tokens.json (camelCase-ключі шкали,
  // ключі кольорів без токена). Клас, який приберуть із коду, — приберуть і звідси.
  const legacy = ['text-sm', 'text-xs', 'text-h5', 'text-h6', 'text-body-s', 'text-2xl'];
  assert.deepEqual([...flagged(legacy)], []);
  assert.deepEqual([...flagged(['sm:text-xs', 'hover:text-dangerHover'])], []);
});

test('літерал і шаблон без підстановок перевіряються, динамічний className — ні', () => {
  const probe = (code) => linter.verify(code, OPTIONS).length;

  assert.equal(probe('<div className="text-body-lg" />;'), 1, 'літерал');
  assert.equal(probe('<div className={`text-body-lg`} />;'), 1, 'шаблон без підстановок');
  assert.equal(probe('const c = "text-body-lg";\n<div className={c} />;'), 0, 'змінна');
  assert.equal(
    probe('const c = "body";\n<div className={`text-${c}`} />;'),
    0,
    'шаблон із підстановкою — статично невідомий клас'
  );
});
