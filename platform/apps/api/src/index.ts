// Публічний вхід API-пакета: спільний Prisma-клієнт і доменні типи, які
// використовують сервіси поза Nest DI. Решта застосунку живе в app.module.ts.
export { prisma } from './prisma';
export * from './domain';
