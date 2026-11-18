// Модульний Prisma-клієнт для інфраструктурних модулів, які не проведені через
// Nest DI (waitlist, loyalty, feedback, discounts). Nest-частина застосунку
// користується PrismaService + PrismaUnitOfWork; тут — прямий клієнт.
//
// Тип навмисно структурний: згенерований Prisma-клієнт не входить у дерево
// репозиторію (він генерується зі schema.prisma під час інсталяції), тому
// конкретні типи моделей тут недоступні під час перевірки типів.

/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');

export const prisma: any = new PrismaClient();
