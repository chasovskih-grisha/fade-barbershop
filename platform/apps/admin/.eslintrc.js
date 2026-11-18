module.exports = {
  root: true,
  extends: ['../../.eslintrc.js', 'next/core-web-vitals'],
  plugins: ['no-phantom-classes'],
  rules: {
    // Гейт «немає фантомних Tailwind-класів» (design-system.md, T-004):
    // className не має містити утиліт, яких немає в tailwind-preset.cjs.
    // Приклад: text-h5, text-h6 — класів h5/h6 немає в preset (є h1-h4, display).
    'no-phantom-classes/no-phantom-classes': 'error',
    // Next.js specific overrides
    '@next/next/no-html-link-for-pages': 'off',
    'react/react-in-jsx-scope': 'off',
    // Гейт «тільки токени» (design-system.md, T-004): hex у коді екранів заборонений.
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
        message:
          'Hex-колір заборонено в UI-коді — використовуйте токени дизайн-системи (design-system.md).',
      },
      {
        selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]',
        message:
          'Hex-колір заборонено в UI-коді — використовуйте токени дизайн-системи (design-system.md).',
      },
    ],
  },
};
