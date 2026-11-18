/**
 * @jest-environment node
 */
import { PATCH } from '../route';
import { NextRequest } from 'next/server';

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('PATCH /api/account/bookings/[id]', () => {
  it('returns 401 when neither Authorization nor Cookie header is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/bookings/b_123', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel', reason: 'Change of plans' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'b_123' }) });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/bookings/b_123', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token123' },
      body: 'invalid-json',
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'b_123' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('returns 400 when schema validation fails for reschedule', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/bookings/b_123', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token123', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reschedule' }), // missing newSlotId
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'b_123' }) });
    expect(res.status).toBe(400);
  });

  it('successfully cancels a booking', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, status: 'cancelled' }),
    });

    const req = new NextRequest('http://localhost:3000/api/account/bookings/b_123', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token123', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', reason: 'Personal' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'b_123' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('cancelled');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/appointments/b_123/cancel'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'Personal' }),
      })
    );
  });

  it('successfully reschedules a booking', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, slotId: 'slot_999' }),
    });

    const req = new NextRequest('http://localhost:3000/api/account/bookings/b_123', {
      method: 'PATCH',
      headers: { Cookie: 'session=abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reschedule', newSlotId: 'slot_999', newDate: '2026-12-01' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'b_123' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.slotId).toBe('slot_999');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity/appointments/b_123/reschedule'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ slotId: 'slot_999', date: '2026-12-01' }),
      })
    );
  });
});
