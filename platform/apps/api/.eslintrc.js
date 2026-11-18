module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  rules: {
    // NestJS specific overrides
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      // Гейт «UUID only» (ADR 0021, T-4300f): доменні id — UUID v7 зі shared
      // kernel, а не randomUUID()/v4(); читабельні id (`loc-1`, `loc_KYY_01`)
      // у коді заборонені — вони не пройдуть у uuid-колонку (T-4300b).
      // Тестові двійники, фікстери й сіди тримають читабельні ключі свідомо
      // (вони — вхід seedUuid()), тому вони поза гейтом; так само статичний
      // демо-каталог. Усе інше в API — лише UUID.
      files: ['src/**/*.ts'],
      excludedFiles: [
        '**/*.spec.ts',
        '**/e2e/**',
        '**/*.fakes.ts',
        '**/*.fixtures.ts',
        '**/test-fixtures.ts',
        '**/*.env.ts',
        '**/*-setup.ts',
        '**/*.setup.ts',
        'src/seed-*.ts',
        'src/catalog/domain/revenue-optimization.ts',
      ],
      rules: {
        'uuid-keys/no-random-uuid': 'error',
        // Swagger-приклад відповіді (`booking-123`) — документація, не дані.
        'uuid-keys/no-readable-id': ['error', { allow: ['booking-123', 'ai-fake', 'ai-gemini'] }],
      },
    },
  ],
};
