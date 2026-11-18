// eslint-plugin-no-phantom-classes
// Detect Tailwind utility classes in className that are not in @fade/design-tokens
// (e.g. text-h5, text-h6 — class scales missing from the preset).
//
// Loads tailwind-preset.cjs at runtime and builds a set of allowed
// prefix:value combinations to validate against.
//
// Гейт ловить лише ті утиліти, для яких у дизайн-системі є словник токенів
// (кольори, типографська шкала, radius, max-width, line-height, font-family).
// Що не флагується, бо токена йому немає й бути не може:
//   1) ядрові утиліти Tailwind — вирівнювання/перенос тексту, сторони й стилі
//      меж, напрямки divide, ширина/зміщення ring, стилі outline, насиченість і
//      дефолтні родини шрифтів, фон (attachment/clip/origin/position/repeat/size/
//      blend/gradient), `line-clamp-*`, ключові ширини (`max-w-full|fit|prose`);
//   2) числові величини (border-2, ring-2, mt-4, w-1/2, max-w-0) і довільні
//      значення Tailwind у квадратних дужках (text-[11px], max-w-[13rem],
//      [mask-type:luminance]) — мігрувати їх нікуди;
//   3) глобальні CSS-ключові слова (none, auto, inherit, initial, unset, revert,
//      revert-layer, transparent, current) і ключові кольори (black, white).
// Кваліфікатори (бік, кут, offset, /opacity) знімаються перед перевіркою:
// Tailwind перевантажує один префікс (`border-t-line` — межа кольором токена,
// `text-center` — вирівнювання, `bg-surface-base/95` — токен із прозорістю).
// Варіанти знімаються узагальнено — усе до останнього `:` верхнього рівня, тож
// `aria-[sort=ascending]:`, `supports-[display:grid]:` і `[&>*]:` теж працюють.
//
// LEGACY_CLASSES — свідомий список спадкових класів, яких у tokens.json немає, але
// які використовуються екранами (text-sm, text-xs, text-body-s, text-h5…). Він
// тимчасовий: клас, який правило більше не флагує, зі списку випадає. Все, чого
// тут немає й немає в токенах, — фантом.

const fs = require('fs');
const path = require('path');

let tree = null;

function loadPreset() {
  if (tree) return tree;
  const pp = [
    path.resolve(process.cwd(), 'packages/design-tokens/dist/tailwind-preset.cjs'),
    path.resolve(process.cwd(), '../packages/design-tokens/dist/tailwind-preset.cjs'),
    path.resolve(process.cwd(), '../../packages/design-tokens/dist/tailwind-preset.cjs'),
  ].find(fs.existsSync);
  if (!pp) return null;
  try {
    const m = require(pp);
    const ext = (m && m.theme && m.theme.extend) || {};
    /** @type {Map<string, Map<string, Map<string, boolean>>>} */
    const t = new Map();
    for (const [group, v] of Object.entries(ext)) {
      const gm = new Map();
      t.set(group, gm);
      if (typeof v === 'string' || Array.isArray(v)) {
        // leaf value: colours (strings) or font families (arrays of fonts)
        gm.set('DEFAULT', new Map());
      } else if (typeof v === 'object' && v !== null) {
        for (const [k, vk] of Object.entries(v)) {
          if (typeof vk === 'string' || Array.isArray(vk)) {
            const km = new Map();
            km.set('DEFAULT', true);
            gm.set(k, km);
          } else if (typeof vk === 'object' && vk !== null) {
            const km = new Map();
            for (const [kk, vvk] of Object.entries(vk)) {
              if (typeof vvk === 'string') km.set(kk, true);
            }
            gm.set(k, km);
          }
        }
      }
    }
    tree = t;
    return t;
  } catch {
    return null;
  }
}

/**
 * Знімає всі варіанти — усе до останнього `:` верхнього рівня (не в дужках).
 * `hover:sm:ring-2` → `ring-2`, `supports-[display:grid]:p-2` → `p-2`.
 */
function stripVariants(token) {
  let depth = 0;
  for (let i = token.length - 1; i >= 0; i -= 1) {
    const ch = token[i];
    if (ch === ']') depth += 1;
    else if (ch === '[') depth = Math.max(0, depth - 1);
    else if (ch === ':' && depth === 0) return token.slice(i + 1);
  }
  return token;
}

/** Числова величина Tailwind — mt-4, ring-2, w-1/2, min-h-24, max-w-0. */
const NUMERIC_VALUE = /^\d+(\/\d+)?(px|rem|em|vh|vw|ch|dvw|dvh|svw|svh|lvw|lvh|fr|%)?$/;

/** Префікси, де число — це ширина/зміщення зі шкали розмірів, а не токен-значення. */
const NUMERIC_PREFIXES = new Set(['border', 'divide', 'ring', 'outline', 'max-w']);

/** Довільне значення/властивість Tailwind: text-[11px], max-w-[13rem], [mask-type:luminance]. */
const isArbitrary = (val) => val.startsWith('[');

/** Глобальні CSS-ключові слова й ключові кольори Tailwind — токена не потребують. */
const CORE_KEYWORD =
  /^(?:none|auto|inherit|initial|unset|revert|revert-layer|transparent|current|black|white)$/;

/**
 * Ядрові утиліти, чиє значення не посилається на шкалу токенів взагалі.
 * Запис — перший сегмент значення (або ціла фамілія): `clip` покриває
 * `bg-clip-text`, `no-repeat` — `bg-no-repeat`, `top` — `bg-top-left`.
 */
const CORE_VALUES = {
  text: [
    'left',
    'center',
    'right',
    'justify',
    'start',
    'end',
    'wrap',
    'nowrap',
    'balance',
    'pretty',
    'ellipsis',
    'clip',
    'opacity',
  ],
  bg: [
    'fixed',
    'local',
    'scroll',
    'clip',
    'origin',
    'center',
    'top',
    'right',
    'bottom',
    'left',
    'repeat',
    'no-repeat',
    'cover',
    'contain',
    'auto',
    'none',
    'blend',
    'gradient',
    'linear',
    'radial',
    'conic',
    'opacity',
  ],
  border: [
    't',
    'r',
    'b',
    'l',
    'x',
    'y',
    's',
    'e',
    'solid',
    'dashed',
    'dotted',
    'double',
    'hidden',
    'collapse',
    'separate',
    'spacing',
    'opacity',
  ],
  divide: ['x', 'y', 'solid', 'dashed', 'dotted', 'double', 'reverse', 'opacity'],
  ring: ['inset', 'opacity'],
  outline: ['solid', 'dashed', 'dotted', 'double', 'hidden'],
  font: [
    'thin',
    'extralight',
    'light',
    'normal',
    'medium',
    'semibold',
    'bold',
    'extrabold',
    'black',
    'sans',
    'serif',
    'mono',
  ],
  rounded: ['t', 'r', 'b', 'l', 'tl', 'tr', 'br', 'bl', 's', 'e', 'ss', 'se', 'ee', 'es'],
  'max-w': ['full', 'min', 'max', 'fit', 'prose', 'screen'],
  'min-w': ['full', 'min', 'max', 'fit'],
};

/** Кваліфікатори між префіксом і значенням: border-t-line, ring-offset-base, rounded-t-card. */
const QUALIFIERS = {
  border: /^(?:t|r|b|l|x|y|s|e)-/,
  divide: /^(?:x|y)-/,
  ring: /^(?:offset-|inset-)/,
  outline: /^offset-/,
  rounded: /^(?:tl|tr|br|bl|ss|se|ee|es|t|r|b|l|s|e)-/,
};

// prefix → preset group. Групи, яких немає в пресеті (spacing, opacity, shadow,
// letterSpacing), перевіряти нема з чим — такі утиліти проходять.
// Префіксів без однойменної утиліти Tailwind тут немає свідомо: `line-`, `fg-`,
// `paper-`, `ink-` — не утиліти, тож єдине, що вони могли б зловити, це колізію
// зі стороннім класом (`line-clamp-2`). `accent-*` (accent-color) існує — він тут.
const CHECKS = [
  { prefix: 'text', group: 'fontSize', group2: 'colors' },
  { prefix: 'font', group: 'fontFamily' },
  { prefix: 'bg', group: 'colors' },
  { prefix: 'border', group: 'colors' },
  { prefix: 'outline', group: 'colors' },
  { prefix: 'divide', group: 'colors' },
  { prefix: 'ring', group: 'colors' },
  { prefix: 'placeholder', group: 'colors' },
  { prefix: 'accent', group: 'colors' },
  { prefix: 'rounded', group: 'borderRadius' },
  { prefix: 'max-w', group: 'maxWidth' },
  { prefix: 'm', group: 'spacing' },
  { prefix: 'mt', group: 'spacing' },
  { prefix: 'mr', group: 'spacing' },
  { prefix: 'mb', group: 'spacing' },
  { prefix: 'ml', group: 'spacing' },
  { prefix: 'mx', group: 'spacing' },
  { prefix: 'my', group: 'spacing' },
  { prefix: 'p', group: 'spacing' },
  { prefix: 'pt', group: 'spacing' },
  { prefix: 'pr', group: 'spacing' },
  { prefix: 'pb', group: 'spacing' },
  { prefix: 'pl', group: 'spacing' },
  { prefix: 'px', group: 'spacing' },
  { prefix: 'py', group: 'spacing' },
  { prefix: 'gap', group: 'spacing' },
  { prefix: 'w', group: 'spacing' },
  { prefix: 'h', group: 'spacing' },
  { prefix: 'min-w', group: 'spacing' },
  { prefix: 'min-h', group: 'spacing' },
  { prefix: 'max-h', group: 'spacing' },
  { prefix: 'space', group: 'spacing' },
  { prefix: 'leading', group: 'lineHeight' },
  { prefix: 'tracking', group: 'letterSpacing' },
  { prefix: 'opacity', group: 'opacity' },
  { prefix: 'shadow', group: 'shadow' },
];

/**
 * Чи є значення в групі пресету. Плоский ключ має пріоритет — саме так
 * Tailwind резолвить клас (`text-body-lg` → ключ `body-lg`, а не `body` + `lg`);
 * далі — вкладений ключ (`bg-surface-base` → colors.surface.base).
 */
function lookupToken(map, val) {
  if (!val) return false;
  if (map.has(val)) return true;
  const parts = val.split('-');
  if (parts.length === 1) return false;
  const top = map.get(parts[0]);
  return Boolean(top && top.has(parts.slice(1).join('-')));
}

/** Чи належить значення ядровій (не токен-шкалі) фамілії цього префікса. */
function hasCoreValue(prefix, val) {
  const core = CORE_VALUES[prefix];
  if (!core) return false;
  return core.some((v) => val === v || val.startsWith(v + '-'));
}

/**
 * Check whether a single Tailwind utility token is allowed by the preset.
 * Returns true if allowed (or not a Tailwind utility), false if phantom.
 */
function allowToken(token, preset) {
  const clean = stripVariants(token);
  if (!clean) return true;
  if (isArbitrary(clean)) return true; // arbitrary property: [mask-type:luminance]

  const dash = clean.indexOf('-');
  if (dash <= 0) return true; // статична утиліта (flex, truncate) або -mb-px

  const prefix = clean.slice(0, dash);
  const first = clean.slice(dash + 1).split('/')[0]; // /opacity — не частина токена
  if (CORE_KEYWORD.test(first)) return true; // bg-transparent, border-none
  if (hasCoreValue(prefix, first)) return true; // text-center, bg-cover, rounded-s

  for (const { prefix: pfx, group, group2 } of CHECKS) {
    if (!clean.startsWith(pfx + '-')) continue;
    const map = preset.get(group);
    const second = group2 ? preset.get(group2) : null;
    if (!map && !second) continue; // групи немає в пресеті — порівнювати нема з чим

    const raw = clean.slice(pfx.length + 1).split('/')[0];
    if (CORE_KEYWORD.test(raw)) return true;
    const qualifier = QUALIFIERS[pfx];
    const val = qualifier ? raw.replace(qualifier, '') : raw;
    if (CORE_KEYWORD.test(val) || hasCoreValue(pfx, val)) return true; // border-t-transparent
    if (isArbitrary(val)) return true; // max-w-[13rem], text-[11px]
    if (NUMERIC_PREFIXES.has(pfx) && NUMERIC_VALUE.test(val)) return true;

    // Значення шукаємо в усіх групах префікса: `bg-accent-blue` — це colors.accent.blue,
    // `divide-line` — colors.line.DEFAULT, `border-border` — плоский ключ colors.border.
    if (map && lookupToken(map, val)) return true;
    if (second && lookupToken(second, val)) return true;
    return false;
  }

  return true; // unrecognised prefix — don't flag
}

module.exports = {
  name: 'no-phantom-classes',

  rules: {
    'no-phantom-classes': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Detect Tailwind utility classes not in @fade/design-tokens (text-h5, text-h6, etc.)',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
      },

      create(context) {
        const preset = loadPreset();
        if (!preset) {
          // Preset not found — silently skip (no design-tokens built yet)
          return {};
        }

        // Спадкові класи, яких у tokens.json немає, але які використовують екрани.
        // Список свідомо короткий і тимчасовий: усе, що вже покривають токени (усі
        // кольори, radius, max-width, leading, tracking), звідси прибрано — інакше він
        // маскує справжні порушення (text-h5 ховався в ньому ж). Форми класу для
        // `fontSize`-токенів позначені camelCase (`textH5`), тож кебаб-класу
        // `text-h5` у пресеті немає — це відома прогалина токенів, не гейта.
        const LEGACY_CLASSES = new Set([
          // шкала типографіки, до якої не дійшли токени (tokens.json: textH5/textH6, textBodyS…)
          'text-h5',
          'text-h6',
          'text-sm',
          'text-xs',
          'text-base',
          'text-xl',
          'text-2xl',
          'text-3xl',
          'text-4xl',
          'text-6xl',
          'text-body-s',
          'text-body-sm',
          'leading-relaxed',
          'bg-accent-primary',
          'bg-surface-hover',
          'text-semantic-error',
          'text-text-primary',
          'text-text-muted',
          'text-action-primary',
          'border-action-primary',
          'text-success',
          // ключі кольорів, які ще не переведено на семантичні токени
          'text-primary',
          'text-danger',
          'text-dangerHover',
          'text-red-600',
        ]);

        return {
          JSXAttribute(node) {
            if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') {
              return;
            }
            const value = node.value;
            if (!value) return;

            let className;
            if (value.type === 'Literal') {
              className = value.value;
            } else if (
              value.type === 'JSXExpressionContainer' &&
              value.expression.type === 'TemplateLiteral' &&
              value.expression.expressions.length === 0
            ) {
              className = value.expression.quasis.map((q) => q.value.cooked).join('');
            }
            if (!className) return;

            const tokens = className.split(/\s+/).filter(Boolean);
            for (const token of tokens) {
              const allowed =
                LEGACY_CLASSES.has(token) ||
                LEGACY_CLASSES.has(stripVariants(token)) ||
                allowToken(token, preset);
              if (!allowed) {
                context.report({
                  node,
                  message:
                    'Tailwind-утиліта "' +
                    token +
                    '" відсутня в @fade/design-tokens — використовуйте класи з дизайн-системи (design-system.md, T-004).',
                });
              }
            }
          },
        };
      },
    },
  },
};
