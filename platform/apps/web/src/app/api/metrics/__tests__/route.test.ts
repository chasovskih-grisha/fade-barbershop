/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Metrics API Route', () => {
  it('returns metrics and correlation id', async () => {
    const req = new NextRequest('http://localhost:3000/api/metrics');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.service).toBe('fade-web');
    expect(data.memoryUsage).toBeDefined();
    expect(res.headers.get('X-Correlation-ID')).toBeTruthy();
  });
});
