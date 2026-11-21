// Email-токени (T-4611a) у вигляді, придатному для Liquid-шаблонів: рендерер
// інжектує їх як `email`, щоб жоден лист не тримав власних кольорів чи
// розмірів (T-4611c). Джерело правди — packages/design-tokens/tokens.json.
//
// Пакет токенів — ESM (`type: module`), API збирається в CommonJS, тому тут
// єдиний `require` на весь email-шар: інакше кожен примітив тягнув би свій.

interface Leaf {
  readonly value: string | number;
}

interface EmailTokenSource {
  bg: Leaf;
  surface: Leaf;
  text: { primary: Leaf; secondary: Leaf };
  border: Leaf;
  accent: { solid: Leaf; onSolid: Leaf };
  radius: Leaf;
  spacing: Leaf;
  fontStack: Leaf;
  fontSize: { body: Leaf; caption: Leaf; title: Leaf; figure: Leaf };
}

// WIP спробував CJS-експорт (`tokens.cjs`), але згенерований артефакт може
// бути старшим за tokens.json (наприклад, без title/figure). Джерело правди —
// tokens.json, тож fallback гарантує актуальні значення й у Jest, і в runtime.
import { createRequire } from 'node:module';

const requireCjs = createRequire(__filename);
const cjsTokens = requireCjs('@fade/design-tokens/tokens.cjs') as {
  tokens: { email: EmailTokenSource };
};
const isComplete = (source: { email: EmailTokenSource }): boolean =>
  Boolean(source.email?.fontSize?.title && source.email?.fontSize?.figure);
const designTokens: { tokens: { email: EmailTokenSource } } = isComplete(cjsTokens.tokens)
  ? cjsTokens
  : {
      tokens: requireCjs('@fade/design-tokens/tokens.json') as { email: EmailTokenSource },
    };

export interface EmailTokens {
  bg: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentSolid: string;
  accentOnSolid: string;
  radius: string;
  spacing: string;
  fontStack: string;
  fontSizeBody: string;
  fontSizeCaption: string;
  fontSizeTitle: string;
  fontSizeFigure: string;
}

const px = (leaf: Leaf): string => `${leaf.value}px`;

/** Плоский view-model токенів: і для Liquid (`email.bg`), і для примітивів. */
export function emailTokens(): EmailTokens {
  const email = designTokens.tokens.email;
  return {
    bg: String(email.bg.value),
    surface: String(email.surface.value),
    textPrimary: String(email.text.primary.value),
    textSecondary: String(email.text.secondary.value),
    border: String(email.border.value),
    accentSolid: String(email.accent.solid.value),
    accentOnSolid: String(email.accent.onSolid.value),
    radius: px(email.radius),
    spacing: px(email.spacing),
    fontStack: String(email.fontStack.value),
    fontSizeBody: px(email.fontSize.body),
    fontSizeCaption: px(email.fontSize.caption),
    fontSizeTitle: px(email.fontSize.title),
    fontSizeFigure: px(email.fontSize.figure),
  };
}
