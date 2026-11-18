// Admin IO contract (T-4521 matrix + T-4522 slot policy): defaults, partial
// merge, range validation (400). Matrix listings - admin-barber-service.matrix.spec.ts.
import { HttpException } from '@nestjs/common';
import { getSlotPolicy, saveSlotPolicy } from './admin-barber-service.io';
import type { SlotPolicyRow } from '../domain/ports.slot-policy';

// prettier-ignore
const row: SlotPolicyRow = { id: 'p1', locationId: 'loc-1', stepMinutes: 30, bufferMinutes: 5, horizonDays: 30, lastMinuteMinutes: 90, timeZone: 'Europe/Kyiv' };

function policyRepo(existing: SlotPolicyRow | null) {
  const save = jest.fn(async () => undefined);
  return { repo: { forLocation: async () => existing, save } as never, save };
}

const status = (p: Promise<unknown>) =>
  p.then(
    () => -1,
    (e: HttpException) => e.getStatus()
  );

describe('admin slot policy IO (T-4522)', () => {
  it('returns defaults with usingDefaults when no row exists', async () => {
    const get = getSlotPolicy(policyRepo(null).repo);
    await expect(get('loc-1')).resolves.toEqual({
      locationId: 'loc-1',
      stepMinutes: 15,
      bufferMinutes: 0,
      horizonDays: 14,
      lastMinuteMinutes: 60,
      timeZone: 'Europe/Kyiv',
      usingDefaults: true,
    });
  });

  it('partial update merges with the existing row and saves a full row', async () => {
    const { repo, save } = policyRepo(row);
    const result = await saveSlotPolicy(repo)('loc-1', { bufferMinutes: 10 });
    expect(result).toEqual({
      locationId: 'loc-1',
      stepMinutes: 30,
      bufferMinutes: 10,
      horizonDays: 30,
      lastMinuteMinutes: 90,
      timeZone: 'Europe/Kyiv',
      usingDefaults: false,
    });
    expect(save).toHaveBeenCalledWith({
      id: 'p1',
      locationId: 'loc-1',
      stepMinutes: 30,
      bufferMinutes: 10,
      horizonDays: 30,
      lastMinuteMinutes: 90,
      timeZone: 'Europe/Kyiv',
    });
  });

  it('rejects out-of-range and off-grid values with 400', async () => {
    const save = saveSlotPolicy(policyRepo(null).repo);
    expect(await status(save('loc-1', { stepMinutes: 20 }))).toBe(400); // off 15-grid
    expect(await status(save('loc-1', { stepMinutes: 75 }))).toBe(400); // above max
    expect(await status(save('loc-1', { bufferMinutes: -1 }))).toBe(400);
    expect(await status(save('loc-1', { horizonDays: 0 }))).toBe(400);
    expect(await status(save('loc-1', { lastMinuteMinutes: 1441 }))).toBe(400);
    expect(await status(save('loc-1', { timeZone: 'Invalid/Zone' }))).toBe(400);
  });

  it('accepts values inside the ranges and valid timeZone', async () => {
    const save = saveSlotPolicy(policyRepo(null).repo);
    const result = await save('loc-1', {
      stepMinutes: 45,
      bufferMinutes: 120,
      horizonDays: 365,
      lastMinuteMinutes: 1440,
      timeZone: 'Europe/Warsaw',
    });
    expect(result).toMatchObject({ stepMinutes: 45, bufferMinutes: 120, timeZone: 'Europe/Warsaw' });
  });
});
