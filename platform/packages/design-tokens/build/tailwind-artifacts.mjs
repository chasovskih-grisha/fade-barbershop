// Споживачі: Tailwind (web/admin) вантажить CJS-пресет; NativeWind (mobile) —
// ESM-тему. Обидва вбудовують один і той самий theme.extend.

import { buildThemeJson } from './theme-extend.mjs';

export const renderTailwindArtifacts = (tokens) => {
  const themeJson = buildThemeJson(tokens);

  const twPreset = `// ЗГЕНЕРОВАНО з tokens.json — НЕ РЕДАГУВАТИ
// Tailwind preset: presets: [require('@fade/design-tokens/tailwind-preset.cjs')]
module.exports = { theme: { extend: ${themeJson} } };
`;

  const twNativeWind = `// ЗГЕНЕРОВАНО з tokens.json — НЕ РЕДАГУВАТИ
// NativeWind theme: import theme from '@fade/design-tokens/nativewind-theme'
const theme = { extend: ${themeJson} };
export default { theme };
`;

  return { twPreset, twNativeWind };
};
