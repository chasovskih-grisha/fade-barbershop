// no-phantom-classes: виявляє Tailwind-утиліти в className, яких немає
// в @fade/design-tokens (tailwind-preset.cjs). Приклад: text-h5, text-h6.
//
// Правило завантажує tailwind-preset.cjs на льоту, будує множину дозволених
// префікс:значення комбінацій і перевіряє кожен токен в className.
//
// Підтримує статичні рядки і шаблонні літерали без інтерполяцій.

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
    /** @type {Map<string, Map<string, boolean>>} */
    const t = new Map();
    for (const [g, v] of Object.entries(ext)) {
      const gm = new Map();
      t.set(g, gm);
      if (typeof v === 'string') {
        gm.set('DEFAULT', true);
      } else if (typeof v === 'object' && v !== null) {
        for (const [k, vk] of Object.entries(v)) {
          if (typeof vk === 'string') {
            const km = new Map();
            km.set('DEFAULT', true);
            gm.set(k, km);
          } else if (typeof vk === 'object' && vk !== null) {
            const km = new Map();
            for (const [kk, vvk] of Object.entries(vk)) {
              if (typeof vvk === 'string') km.set(vk, true);
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
 * Перевірити один токен Tailwind-класу.
 * Повертає true — дозволено (або не Tailwind-клас, не треба валідувати).
 * Повертає false — phantom-клас, треба повідомити.
 */
function allowToken(token, tree) {
  // Відкидаємо variant/responsive префікси
  const clean = token.replace(
    /^(?:hover|focus|focus-within|focus-visible|active|disabled|visited|group-hover|peer-hover|placeholder|before|after|first|last|odd|even|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|nth-[^:\s]+):/,
    ''
  );
  if (!clean) return true;

  const dash = clean.indexOf('-');
  if (dash < 0) return true; // без роздільника — кастомний клас, не Tailwind

  const prefix = clean.slice(0, dash);
  const value = clean.slice(dash + 1);

  // Префікси, які треба валідувати проти preset
  const checked = [
    { prefix: 'text', group: 'fontSize' },
    { prefix: 'font', group: 'fontFamily', split: true },
    { prefix: 'bg', group: 'colors' },
    { prefix: 'border', group: 'colors' },
    { prefix: 'rounded', group: 'borderRadius' },
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
    { prefix: 'max-w', group: 'maxWidth' },
    { prefix: 'min-h', group: 'spacing' },
    { prefix: 'max-h', group: 'spacing' },
    { prefix: 'space', group: 'spacing' },
    { prefix: 'leading', group: 'lineHeight' },
    { prefix: 'tracking', group: 'lineHeight' },
    { prefix: 'opacity', group: 'opacity' },
    { prefix: 'shadow', group: 'shadow' },
  ];

  for (const { prefix: pfx, group, split } of checked) {
    if (!clean.startsWith(pfx + '-')) continue;
    const val = clean.slice(pfx.length + 1);
    const gm = tree.get(group);
    if (!gm) continue;
    if (split) {
      // fontFamily: font-display → fontFamily.display
      const top = val.split('-')[0];
      const gm2 = gm.get(top);
      if (!gm2 || !gm2.has('DEFAULT')) return false;
    } else {
      const parts = val.split('-');
      // bg-surface-base → colors.surface.base
      // bg-accent-blue → colors.accent.blue
      // bg-surface → colors.surface.DEFAULT
      if (parts.length === 1) {
        if (!gm.has(parts[0]) || !gm.get(parts[0]).has('DEFAULT')) return false;
      } else {
        const gm2 = gm.get(parts[0]);
        if (!gm2 || !gm2.has(parts.slice(1).join('-'))) return false;
      }
    }
    return true;
  }

  return true; // неперевірений префікс — не희다 помилку
}

module.exports = {
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
    messages: {
      phantomClass:
        'Tailwind-утиліта "{token}" відсутня в @fade/design-tokens — використовуйте класи з дизайн-системи (design-system.md, T-004).',
    },
  },
  create(context) {
    const tree = loadPreset();
    if (!tree) return {};

    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') return;
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

        context.debug(`className: ${className}`);
        for (const token of className.split(/\s+/).filter(Boolean)) {
          const ok = allowToken(token, tree);
          context.debug(`  token=${token} allow=${ok}`);
          if (!ok) {
            context.report({
              node,
              messageId: 'phantomClass',
              data: { token },
            });
          }
        }
      },
    };
  },
};
