const path = require('path');

// babel-preset-expo живе в дереві залежностей `expo` (SDK 50), а не серед
// прямих залежностей @fade/mobile — тож резолвимо його явно від `expo`.
// Без цього пресета jest-expo не трансформує Flow-синтаксис React Native
// (`type X = ...`), і будь-який тест падає ще до запуску.
module.exports = function (api) {
  api.cache(true);
  const preset = require.resolve('babel-preset-expo', {
    paths: [path.dirname(require.resolve('expo/package.json'))],
  });
  return {
    presets: [preset],
  };
};
