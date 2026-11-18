// Генератор CSS-змінних з tokens.json — єдиного джерела правди (design-system.md).
// Запуск: node build.mjs (або pnpm build). Вихід: dist/tokens.css
// Правило kit (T-004): продуктовий код споживає згенеровані файли, ніколи не редагує їх.
// Генерація розбита на кроки в build/ — по одному артефакту на модуль.

import { copyFileSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTokensCss } from './build/tokens-css.mjs';
import { renderJsExports } from './build/machine-exports.mjs';
import { renderTailwindArtifacts } from './build/tailwind-artifacts.mjs';
import { renderFonts } from './build/fonts.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const distDir = join(root, 'dist');
const distFontsDir = join(distDir, 'fonts');
const fontsDir = join(root, 'fonts');

const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const { css, varCount } = renderTokensCss(tokens);
const { js, dts } = renderJsExports(tokens);
const { twPreset, twNativeWind } = renderTailwindArtifacts(tokens);
const { fontFiles, fontsCss } = renderFonts(tokens);

const cssPath = join(distDir, 'tokens.css');
const jsPath = join(distDir, 'tokens.js');
const twPresetPath = join(distDir, 'tailwind-preset.cjs');
const twNativeWindPath = join(distDir, 'nativewind-theme.js');
const fontsCssPath = join(distDir, 'fonts.css');

const exists = (path) => {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
};

// --check: dist мусить дорівнювати джерелу (гейт CI). Нічого не пише.
if (process.argv.includes('--check')) {
  const read = (path) => {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      return null;
    }
  };

  const mismatched = [
    [cssPath, css],
    [jsPath, js],
    [join(distDir, 'tokens.d.ts'), dts],
    [twPresetPath, twPreset],
    [twNativeWindPath, twNativeWind],
    [fontsCssPath, fontsCss],
  ].filter(([path, expected]) => read(path) !== expected);

  const missingFonts = fontFiles.filter((f) => !exists(join(distFontsDir, f)));
  if ([...mismatched, ...missingFonts.map((f) => [fontsDir, f])].length > 0) {
    const names = mismatched
      .map(([path]) => path.slice(root.length + 1))
      .concat(missingFonts.map((f) => `fonts/${f}`))
      .join(', ');
    console.error(`design-tokens: dist розійшлося з джерелом (${names}). Запусти build.`);
    process.exit(1);
  }

  console.log('design-tokens: dist відповідає tokens.json + fonts');
  process.exit(0);
}

mkdirSync(distDir, { recursive: true });
mkdirSync(distFontsDir, { recursive: true });
writeFileSync(cssPath, css);
writeFileSync(jsPath, js);
writeFileSync(join(distDir, 'tokens.d.ts'), dts);
writeFileSync(twPresetPath, twPreset);
writeFileSync(twNativeWindPath, twNativeWind);
writeFileSync(fontsCssPath, fontsCss);
copyFileSync(join(fontsDir, 'README.md'), join(distFontsDir, 'README.md'));
for (const file of fontFiles) {
  copyFileSync(join(fontsDir, file), join(distFontsDir, file));
}

console.log(
  `design-tokens: ${varCount} змінних → dist/tokens.css, dist/tokens.js, dist/tailwind-preset.cjs, dist/nativewind-theme.js; ${fontFiles.length} шрифтів → dist/fonts.css + dist/fonts/`
);
