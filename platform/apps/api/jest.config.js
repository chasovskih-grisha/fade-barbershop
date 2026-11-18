module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // E2E-сюїти ділять одну БД: повна паралельність workers вичерпує пул
  // з'єднань і породжує P2034-шторми (спорадичні 409/500/404). 50% CPU —
  // стабільний компроміс до ~480 тестів (10/10 зелених прогонів); після
  // T-4533 (~486) почався ротаційний флейк під навантаженням → 40%,
  // після T-041 client-confirm (~488) → 35% (кожне зниження — серія
  // зелених прогонів; флейк завжди ротаційний — різний тест щопрогону).
  maxWorkers: '35%',
  passWithNoTests: true,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.fakes.ts',
    // Адаптери інфраструктури упечутують транзакції Prisma і HTTP-межі:
    // їх покривають e2e (T-016), не unit. Домен + application — unit/functional.
    '!src/**/infrastructure/**',
    '!src/shared/prisma/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/**/domain/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/**/application/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@fade/(contracts|domain-shared|test-utils)$': '<rootDir>/../../packages/$1/src',
  },
};
