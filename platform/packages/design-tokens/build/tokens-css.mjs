// Генерація dist/tokens.css: CSS-змінні з tokens.json (кольори, радіуси,
// spacing, типографіка) + світла тема .theme-paper (друк/email/документи).

export const renderTokensCss = (tokens) => {
  let out = `/* === ЗГЕНЕРОВАНО з tokens.json — НЕ РЕДАГУВАТИ ===
   Джерело: packages/design-tokens/tokens.json
   Специфікація: development/platform/docs/design-system.md
   Регенерація: pnpm --filter @fade/design-tokens build
*/
:root {
`;

  const lines = [];

  // — Кольори: surface/border/text/accent/interactive/semantic/lightTheme
  for (const [group, entries] of Object.entries(tokens.color)) {
    for (const [key, tok] of Object.entries(entries)) {
      lines.push([`color-${group}-${key}`, tok.value, tok.comment]);
    }
  }

  // — Радіуси
  for (const [key, tok] of Object.entries(tokens.radius)) {
    if (key === 'comment') continue;
    lines.push([`radius-${key}`, `${tok.value}px`, tok.comment]);
  }

  // — Spacing
  tokens.spacing.scale.forEach((px, i) => lines.push([`space-${i + 1}`, `${px}px`, null]));
  lines.push(['space-base', `${tokens.spacing.scale[0]}px`, 'база 4px']);

  // — Типографіка: сімейства і шкала
  for (const [key, tok] of Object.entries(tokens.typography.fontFamily)) {
    lines.push([`font-${key}`, `'${tok.value}', system-ui, sans-serif`, tok.comment]);
  }
  for (const [key, tok] of Object.entries(tokens.typography.fontSize)) {
    lines.push([`font-size-${key}`, `${tok.value}px`, tok.comment]);
  }

  // — Email-шар (T-4611a): світла тема Paper/Ink для листів. Кольори/шрифт/
  //   розміри фіксуються токеном, щоб шаблони не мали власних hex. Вкладені
  //   ключі (text.primary, accent.solid, fontSize.body) → `--email-text-primary`.
  const flattenEmail = (obj, prefix) => {
    const out = [];
    for (const [key, tok] of Object.entries(obj)) {
      if (key === 'comment') continue;
      const name = prefix ? `${prefix}-${key}` : key;
      if (tok && typeof tok === 'object' && 'value' in tok) out.push([name, tok.value, tok.comment]);
      else if (tok && typeof tok === 'object') out.push(...flattenEmail(tok, name));
    }
    return out;
  };
  for (const [name, value, c] of flattenEmail(tokens.email, '')) {
    const isPx = name === 'radius' || name === 'spacing' || name.startsWith('fontSize');
    lines.push([`email-${name}`, isPx ? `${value}px` : value, c]);
  }

  const comment = (c) => (c ? ` /* ${c} */` : '');
  for (const [name, value, c] of lines) {
    out += `  --${name}: ${value};${comment(c)}\n`;
  }

  // — Мапа статусів візиту → тон StatusPill (кастомні властивості не потрібні:
  //    мапа споживається JS-компонентом; тут лише документація конвенції)
  out += `}\n`;

  // Додатковий експорт: світла тема як окремий scope (друк/email/документи)
  out += `
/* Світла тема: роздруківки, email, документи — не основні поверхні */
.theme-paper {
  --color-surface-base: ${tokens.color.lightTheme.paper.value};
  --color-text-primary: ${tokens.color.lightTheme.ink.value};
}
`;

  return { css: out, varCount: lines.length };
};
