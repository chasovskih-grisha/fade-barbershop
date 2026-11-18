import { Test } from '@nestjs/testing';
import { DatabaseHealthContributor } from './database-health.contributor';
import { PrismaService } from '../prisma/prisma.service';

describe('DatabaseHealthContributor', () => {
  let contributor: DatabaseHealthContributor;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DatabaseHealthContributor],
    }).compile();
    contributor = module.get(DatabaseHealthContributor);
  });

  it('повертає not_configured, якщо PrismaService відсутній', async () => {
    const section = await contributor.snapshot(null);
    expect(section).toEqual({
      status: 'not_configured',
      latencyMs: null,
      error: null,
    });
  });

  it('повертає connected, якщо $queryRaw успішний', async () => {
    const mockPrisma = {
      $queryRaw: async () => [{ 1: 1 }],
    } as unknown as PrismaService;

    const section = await contributor.snapshot(mockPrisma);
    expect(section.status).toBe('connected');
    expect(typeof section.latencyMs).toBe('number');
    expect(section.error).toBeNull();
  });

  it('повертає degraded, якщо $queryRaw викидає помилку', async () => {
    const mockPrisma = {
      $queryRaw: async () => {
        throw new Error('connection refused');
      },
    } as unknown as PrismaService;

    const section = await contributor.snapshot(mockPrisma);
    expect(section.status).toBe('degraded');
    expect(section.error).toBe('connection refused');
    expect(typeof section.latencyMs).toBe('number');
  });
});
