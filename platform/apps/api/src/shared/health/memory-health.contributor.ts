import { Injectable } from '@nestjs/common';

export interface MemoryHealthSection {
  rssBytes: number;
  heapTotalBytes: number;
  heapUsedBytes: number;
  externalBytes: number;
  arrayBuffersBytes: number;
  heapUsagePercent: number;
}

@Injectable()
export class MemoryHealthContributor {
  snapshot(): MemoryHealthSection {
    const mem = process.memoryUsage();
    const heapUsagePercent =
      mem.heapTotal > 0 ? Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(2)) : 0;
    return {
      rssBytes: mem.rss,
      heapTotalBytes: mem.heapTotal,
      heapUsedBytes: mem.heapUsed,
      externalBytes: mem.external,
      arrayBuffersBytes: mem.arrayBuffers ?? 0,
      heapUsagePercent,
    };
  }
}
