// Знак бренду в листі (T-4611b). Лист стоїть на paper, тому хром бере
// milk-lockup; night лишається сайту й застосунку (T-4609b/c/d).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { emailTokens } from './email-tokens';

const LOGO_FILES: Record<'milk' | 'dark', string> = {
  milk: 'lockup-on-milk.svg',
  dark: 'lockup-on-dark.svg',
};

function assetCandidates(file: string): string[] {
  return [
    path.resolve(__dirname, '../../../../../../packages/brand-assets/assets', file),
    path.resolve(process.cwd(), '../../packages/brand-assets/assets', file),
    path.resolve(process.cwd(), 'packages/brand-assets/assets', file),
  ];
}

const logoCache = new Map<string, string | undefined>();

function readAsset(assetPath: string): string | undefined {
  if (logoCache.has(assetPath)) return logoCache.get(assetPath);
  const found = existsSync(assetPath)
    ? assetPath
    : assetCandidates(assetPath).find((candidate) => existsSync(candidate));
  const svg = found ? readFileSync(found, 'utf8') : undefined;
  logoCache.set(assetPath, svg);
  return svg;
}

/** Текстовий wordmark — фолбек, коли асету бренду немає (шапка не зникає). */
export function emailLogoWordmark(): string {
  const t = emailTokens();
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
<tr>
<td style="font-family:${t.fontStack};font-weight:800;font-size:${t.fontSizeTitle};letter-spacing:0.35em;text-transform:uppercase;color:${t.textPrimary};">FADE</td>
</tr>
</table>`;
}

/**
 * SVG вставляється data-URI: жодного зовнішнього хоста, який клієнт може
 * заблокувати. `alt` обов'язковий; `assetPath` — явний асет (тест фолбека).
 */
export function emailLogo(variant: 'milk' | 'dark' = 'milk', assetPath?: string): string {
  const svg = readAsset(assetPath ?? LOGO_FILES[variant]);
  if (!svg) return emailLogoWordmark();
  const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
<tr>
<td>
<img src="${source}" width="155" height="62" alt="FADE — Barbershop" style="display:block;width:155px;max-width:100%;height:auto;border:0;" />
</td>
</tr>
</table>`;
}
