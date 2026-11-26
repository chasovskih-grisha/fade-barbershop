import type { DepositHold } from '../domain/deposit-hold';
import { NudgeExpiringHolds, type ExpiringHoldNotice } from './nudge-expiring-holds';

const NOW = new Date('2026-11-26T10:00:00Z');

function hold(overrides: Partial<DepositHold> = {}): DepositHold {
  return {
    id: 'hold-1',
    appointmentId: 'apt-1',
    barberId: 'barber-1',
    locationId: 'loc-1',
    startAt: new Date('2026-11-27T09:00:00Z'),
    endAt: new Date('2026-11-27T10:00:00Z'),
    expiresAt: new Date('2026-11-26T10:03:00Z'),
    depositAmount: 210,
    status: 'active',
    createdAt: new Date('2026-11-26T09:45:00Z'),
    updatedAt: new Date('2026-11-26T09:45:00Z'),
    ...overrides,
  } as DepositHold;
}

describe('NudgeExpiringHolds (T-4619)', () => {
  const claimed: string[] = [];
  let holds: DepositHold[];
  let alreadyNoticed: Set<string>;

  function run() {
    return new NudgeExpiringHolds({
      holds: { listByStatus: async () => holds },
      notices: {
        claim: async (notice: ExpiringHoldNotice) => {
          if (alreadyNoticed.has(notice.appointmentId)) return false;
          claimed.push(notice.appointmentId);
          return true;
        },
      },
      clock: { now: () => NOW },
    }).run();
  }

  beforeEach(() => {
    holds = [hold()];
    alreadyNoticed = new Set();
    claimed.length = 0;
  });

  it('нагадує про утримання, чий дедлайн настає в межах вікна', async () => {
    await expect(run()).resolves.toEqual(['apt-1']);
    expect(claimed).toEqual(['apt-1']);
  });

  it('не чіпає утримання, до дедлайну якого ще далеко', async () => {
    holds = [hold({ expiresAt: new Date('2026-11-26T10:30:00Z') })];
    await expect(run()).resolves.toEqual([]);
  });

  it('не нагадує про вже прострочене утримання', async () => {
    holds = [hold({ expiresAt: new Date('2026-11-26T09:59:00Z') })];
    await expect(run()).resolves.toEqual([]);
  });

  it('не нагадує вдруге, якщо подія вже в outbox', async () => {
    alreadyNoticed.add('apt-1');
    await expect(run()).resolves.toEqual([]);
    expect(claimed).toEqual([]);
  });

  it('пропускає неактивне утримання', async () => {
    holds = [hold({ status: 'captured' })];
    await expect(run()).resolves.toEqual([]);
  });
});
