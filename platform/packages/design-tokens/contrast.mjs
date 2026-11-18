// Контраст-гейт T-004: WCAG 2.1 AA на темній базі (design-system.md §Доступність).
// Запуск: node contrast.mjs (або pnpm --filter @fade/design-tokens contrast).
// Провалені пари → exit 1 (гейт CI разом із verify).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));

const c = tokens.color;

/** WCAG 2.1 relative luminance 0..1. */
function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const P = (name, fg, bg, min) => ({ name, fg, bg, min });
const TEXT_MIN = 4.5;
const BORDER_MIN = 3;

const pairs = [
  P('text.primary / surface.base', c.text.primary.value, c.surface.base.value, TEXT_MIN),
  P('text.secondary / surface.base', c.text.secondary.value, c.surface.base.value, TEXT_MIN),
  P('text.muted / surface.base', c.text.muted.value, c.surface.base.value, TEXT_MIN),
  P('accent.blue / surface.base', c.accent.blue.value, c.surface.base.value, TEXT_MIN),
  P(
    'accent.onSolid / accent.solid (CTA-інверсія)',
    c.accent.onSolid.value,
    c.accent.solid.value,
    TEXT_MIN
  ),
];

// Email-шар (T-4611a): світла тема Paper/Ink. Текст ≥ 4.5:1, межі ≥ 3:1 —
// гейт у CI разом з рештою пар, бо контраст «на око» в листах не ловиться.
const e = tokens.email;
const emailPairs = [
  P('email.text.primary / email.bg', e.text.primary.value, e.bg.value, TEXT_MIN),
  P('email.text.secondary / email.bg', e.text.secondary.value, e.bg.value, TEXT_MIN),
  P('email.border / email.bg', e.border.value, e.bg.value, BORDER_MIN),
  P('email.accent.onSolid / email.accent.solid (CTA)', e.accent.onSolid.value, e.accent.solid.value, TEXT_MIN),
];
pairs.push(...emailPairs);

// Звіт (не гейт): семантика і фони-контейнери для StatusPill/Button.
const report = [
  P('semantic.success / surface.base', c.semantic.success.value, c.surface.base.value, TEXT_MIN),
  P('semantic.warning / surface.base', c.semantic.warning.value, c.surface.base.value, TEXT_MIN),
  P('semantic.danger / surface.base', c.semantic.danger.value, c.surface.base.value, TEXT_MIN),
  P('semantic.info / surface.base', c.semantic.info.value, c.surface.base.value, TEXT_MIN),
  P(
    'fg (Bone) / interactive.default (secondary btn)',
    c.text.primary.value,
    c.interactive.default.value,
    3
  ),
  P(
    'accent.solid / surface.base (Bone-текст на Night не CTA)',
    c.accent.solid.value,
    c.surface.base.value,
    TEXT_MIN
  ),
];

const fmt = (v) => v.toFixed(2).padStart(5);
const line = (p) => {
  const ratio = contrast(p.fg, p.bg);
  const pass = ratio >= p.min;
  return `${fmt(ratio)}:1  ${pass ? '✓' : '✗'}  ${p.name}  (мін ${p.min})`;
};

const results = [...pairs, ...report];

for (const p of pairs) {
  console.log(`  ${p.name}  →  ${line(p)}`);
}
console.log('  --- звіт (не гейт) ---');
for (const p of report) {
  console.log(`  ${line(p)}`);
}

const failed = pairs.filter((p) => contrast(p.fg, p.bg) < p.min);
if (failed.length > 0) {
  console.error(
    `design-tokens: контраст нижче WCAG AA (${failed.map((f) => f.name).join(', ')}). Виправ токен.`
  );
  process.exit(1);
}
console.log('design-tokens: контраст WCAG AA — всі пари > 4.5:1');
