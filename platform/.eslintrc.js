module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    // project: ['./tsconfig.base.json'], // Disabled for now, will enable when tsconfigs are properly set up
  },
  // React/Next configs live in the packages that render UI (apps/web, apps/admin,
  // apps/mobile) — the API and shared packages must not inherit React rules.
  plugins: ['@typescript-eslint', 'no-phantom-classes', 'uuid-keys'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    // Quality gates from engineering-principles.md
    'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
    complexity: ['error', 10],
    'max-params': ['error', 3],
    'max-depth': ['error', 4],
    'max-statements': ['error', 30],

    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General code quality
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
    // max-lines exceptions from T-001 / ADR 0019
    '**/*.d.ts',
    '**/generated/**',
    '**/__snapshots__/**',
  ],

  overrides: [
    {
      // Гейт «тільки токени» (design-system.md, T-004): hex у коді екранів заборонений.
      // Значення живуть у @fade/design-tokens; UI-код — Tailwind-утиліти або var(--*).
      // apps/web і apps/admin мають власні root-конфіги, тому той самий rule продубльовано там.
      // Mobile долучається у фазі 6, коли підключено NativeWind-тему.
      files: ['packages/ui/src/**/*.{ts,tsx}'],
      rules: {
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
    },
    {
      // Гейт «немає фантомних Tailwind-класів» (design-system.md, T-004):
      // className не має містити утиліт, яких немає в tailwind-preset.cjs.
      // Приклад: text-h5, text-h6 — класів h5/h6 немає в preset (є h1-h4, display).
      files: ['apps/web/src/**/*.{ts,tsx}', 'apps/admin/src/**/*.{ts,tsx}'],
      rules: {
        'no-phantom-classes/no-phantom-classes': 'error',
      },
    },
  ],
};
