import { Test } from '@nestjs/testing';
import { MemoryHealthContributor } from './memory-health.contributor';

describe('MemoryHealthContributor', () => {
  it('returns valid memory usage snapshot', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MemoryHealthContributor],
    }).compile();

    const contributor = moduleRef.get(MemoryHealthContributor);
    const snap = contributor.snapshot();

    expect(snap.rssBytes).toBeGreaterThan(0);
    expect(snap.heapTotalBytes).toBeGreaterThan(0);
    expect(snap.heapUsedBytes).toBeGreaterThan(0);
    expect(typeof snap.heapUsagePercent).toBe('number');
  });
});
