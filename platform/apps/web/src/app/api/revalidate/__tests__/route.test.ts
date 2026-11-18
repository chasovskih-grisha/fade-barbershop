/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('POST /api/revalidate', () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.NEXT_REVALIDATE_SECRET;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NEXT_REVALIDATE_SECRET = 'test-secret-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_REVALIDATE_SECRET = originalSecret;
  });

  it('returns 401 if secret is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/revalidate?secret=wrong-secret', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid secret');
  });

  it('returns 400 if JSON body is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/revalidate?secret=test-secret-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('revalidates a specific path when provided in body', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/revalidate?secret=test-secret-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/blog/custom-slug' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revalidated).toBe(true);
    expect(data.paths).toEqual(['/blog/custom-slug']);
  });

  it('revalidates blog index and articles when no specific path is provided', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ slug: 'article-1' }, { slug: 'article-2' }],
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    const req = new NextRequest('http://localhost:3000/api/revalidate?secret=test-secret-token', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revalidated).toBe(true);
    expect(data.paths).toEqual(['/blog', '/blog/article-1', '/blog/article-2']);
  });
});
