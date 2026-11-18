/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Health API Route', () => {
  it('returns healthy status and correlation id', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('fade-web');
    expect(res.headers.get('X-Correlation-ID')).toBeTruthy();
  });
});
