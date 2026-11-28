module.exports = {
  preset: 'jest-expo',
  passWithNoTests: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@fade/(contracts|domain-shared)$': '<rootDir>/../../packages/$1/src',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'],
  // pnpm ставить пакети в node_modules/.pnpm/<pkg>/node_modules/<pkg>; без
  // явного .pnpm у allowlist перший-ліпший node_modules/.pnpm робить файл
  // "ignored", і Flow-синтаксис React Native не трансформується.
  transformIgnorePatterns: [
    'node_modules/(?!(\.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|decode-uri-component|query-string))',
  ],
};
