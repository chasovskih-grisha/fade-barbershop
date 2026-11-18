// Машинний експорт для JS/NativeWind-споживачів (statusPill мапа, значення
// для тем) і типи для TS/RN — виводяться з оригінального tokens.json (автосинк).

export const renderJsExports = (tokens) => {
  const js = `// ЗГЕНЕРОВАНО з tokens.json — НЕ РЕДАГУВАТИ
module.exports.tokens = ${JSON.stringify(tokens, null, 2)};
module.exports.visitStatusTone = ${JSON.stringify(tokens.visitStatus, null, 2)};
`;

  const dts = `// ЗГЕНЕРОВАНО з tokens.json — НЕ РЕДАГУВАТИ
export type TokenValue = string | number;
export const tokens: typeof import('../tokens.json')['default'];
export const visitStatusTone: typeof import('../tokens.json')['default']['visitStatus'];
`;

  return { js, dts };
};
