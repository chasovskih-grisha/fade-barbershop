import { PrismaService } from './shared/prisma/prisma.service';
import { seedAdmin } from './seed-admin';

const KEYS = ['FADE_ADMIN_PHONE', 'FADE_ADMIN_USERNAME', 'FADE_ADMIN_PASSWORD'] as const;
const NODE_ENV = process.env.NODE_ENV;

type FakeUserRepo = {
  findUnique: jest.Mock;
  update: jest.Mock;
  create: jest.Mock;
};

const makePrisma = (): FakeUserRepo => ({
  findUnique: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
});

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
  if (NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = NODE_ENV;
});

describe('seedAdmin', () => {
  it('creates the founder admin when absent', async () => {
    const prisma = makePrisma();
    prisma.findUnique.mockResolvedValue(null);
    const msg = await seedAdmin({ user: prisma } as unknown as PrismaService);
    expect(msg).toContain('created');
    expect(prisma.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ phone: '+380000000001', role: 'admin', username: 'owner' }),
    });
  });

  it('updates the admin when already present', async () => {
    const prisma = makePrisma();
    prisma.findUnique.mockResolvedValue({ id: 'u1' });
    const msg = await seedAdmin({ user: prisma } as unknown as PrismaService);
    expect(msg).toContain('updated');
    expect(prisma.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({ role: 'admin' }),
    });
  });

  it('throws when the phone is not a valid E.164 number', async () => {
    process.env.FADE_ADMIN_PHONE = 'not-e164';
    await expect(seedAdmin({ user: makePrisma() } as unknown as PrismaService)).rejects.toThrow(
      'valid E.164'
    );
  });

  it('throws when the password is too short', async () => {
    process.env.FADE_ADMIN_PASSWORD = 'x';
    await expect(seedAdmin({ user: makePrisma() } as unknown as PrismaService)).rejects.toThrow(
      'at least'
    );
  });

  it('refuses dev default credentials in production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(seedAdmin({ user: makePrisma() } as unknown as PrismaService)).rejects.toThrow(
      'required in production'
    );
  });

  it('seeds the founder in production when all credentials are provided', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FADE_ADMIN_PHONE = '+380501112233';
    process.env.FADE_ADMIN_USERNAME = 'founder';
    process.env.FADE_ADMIN_PASSWORD = 'ProductionPass123';
    const prisma = makePrisma();
    prisma.findUnique.mockResolvedValue(null);

    await expect(seedAdmin({ user: prisma } as unknown as PrismaService)).resolves.toContain(
      'created'
    );
  });
});
