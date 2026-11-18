export type FakeUserRepo = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};
export type FakeProfileRepo = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

export const makeSeedPrisma = (): { user: FakeUserRepo; clientProfile: FakeProfileRepo } => ({
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    // сід читає createdUser.id — мок повертає рядок, як справжня Prisma
    create: jest.fn().mockResolvedValue({ id: 'u1' }),
    update: jest.fn(),
  },
  clientProfile: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  },
});

export const SEED_ENV_KEYS = ['FADE_SEED_CUSTOMERS_PHONE', 'FADE_SEED_CUSTOMERS_NAME'] as const;
