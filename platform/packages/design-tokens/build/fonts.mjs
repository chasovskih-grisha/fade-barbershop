// Шрифти: мінімальний робочий набір Fixel для web/admin (brand/fade_01_kit/fonts).
// @font-face генерується з токенів сімейств; файли копіюються в dist/fonts.

const WEIGHT_NAMES = {
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
};

export const renderFonts = (tokens) => {
  const webFonts = [
    {
      family: tokens.typography.fontFamily.display.value,
      file: 'FixelDisplay',
      weights: [600, 700, 800],
    },
    {
      family: tokens.typography.fontFamily.text.value,
      file: 'FixelText',
      weights: [400, 500, 600],
    },
  ];

  const fontFiles = [];
  const fontFaces = [];
  for (const { family, file, weights } of webFonts) {
    for (const weight of weights) {
      fontFiles.push(`${file}-${WEIGHT_NAMES[weight]}.woff2`);
      fontFaces.push(
        `@font-face {\n  font-family: '${family}';\n  src: url('fonts/${file}-${WEIGHT_NAMES[weight]}.woff2') format('woff2');\n  font-weight: ${weight};\n  font-style: normal;\n  font-display: swap;\n}`
      );
    }
  }

  const fontsCss = `/* === ЗГЕНЕРОВАНО build.mjs — шрифти Fixel (див. packages/design-tokens/fonts) ===
   Мінімальний робочий набір T-004: ${tokens.typography.fontFamily.display.value} 600/700/800 + ${tokens.typography.fontFamily.text.value} 400/500/600.
   Повний набір і ліцензія: brand/fade_01_kit/fonts (free for commercial use, MacPaw/AlfaBravo).
   Підключення: import '@fade/design-tokens/fonts' у кореневому layout.
*/\n${fontFaces.join('\n\n')}\n`;

  return { fontFiles, fontsCss };
};
