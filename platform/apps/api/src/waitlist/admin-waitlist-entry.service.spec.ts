/* eslint-disable max-lines -- cohesive module (167 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { WaitlistService } from './waitlist.service';
import type { WaitlistEntry, WaitlistServiceDeps } from './waitlist.domain';

/** Реальний сервіс з мокованими ports: метод, що тестується, не підміняється. */
function makeService(): WaitlistService {
  const deps = {
    createWaitlistEntry: jest.fn(async (entry: Omit<WaitlistEntry, 'id'>) => ({
      ...entry,
      id: 'entry-1',
    })),
    holdSlot: jest.fn(async () => ({
      id: 'hold-1',
      slotId: 'slot-1',
      locationId: 'loc-1',
      barberId: 'barber-1',
      holdExpiry: new Date(Date.now() + 15 * 60 * 1000),
      holdByClientId: 'client-1',
      holdByTime: new Date(),
      status: 'active',
    })),
    releaseHold: jest.fn(async () => undefined),
    getActiveWaitlist: jest.fn(async () => []),
    getClientHistory: jest.fn(async () => ({
      clientId: 'client-1',
      noShowsOnWaitlist: 0,
      missesOnWaitlist: 0,
    })),
    checkRateLimit: jest.fn(async () => true),
    fulfillWaitlistEntry: jest.fn(async () => ({ id: 'booking-1' })),
  } as unknown as WaitlistServiceDeps;

  return new WaitlistService(deps);
}

describe('WaitlistService - adminCreateWaitlistEntry', () => {
  let service: WaitlistService;

  beforeEach(() => {
    service = makeService();
  });

  it('should create a waitlist entry with all required fields', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('entry-1');
    expect(result.slotId).toBe('slot-1');
    expect(result.clientId).toBe('client-1');
    expect(result.locationId).toBe('loc-1');
    expect(result.barberId).toBe('barber-1');
    expect(result.serviceId).toBe('service-1');
    expect(result.agreedPrice).toBe(150);
    expect(result.status).toBe('active');
    expect(result.holdExpiry).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should use default status ACTIVE when status not provided', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00'
    );

    expect(result.status).toBe('active');
  });

  it('should accept custom status', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00',
      undefined,
      undefined,
      undefined,
      'on_hold'
    );

    expect(result.status).toBe('on_hold');
  });

  it('should validate slotId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('', 'client-1', 'loc-1', 'barber-1', 'service-1', '150.00')
    ).rejects.toThrow('slotId is required');
  });

  it('should validate clientId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('slot-1', '', 'loc-1', 'barber-1', 'service-1', '150.00')
    ).rejects.toThrow('clientId is required');
  });

  it('should validate locationId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('slot-1', 'client-1', '', 'barber-1', 'service-1', '150.00')
    ).rejects.toThrow('locationId is required');
  });

  it('should validate barberId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('slot-1', 'client-1', 'loc-1', '', 'service-1', '150.00')
    ).rejects.toThrow('barberId is required');
  });

  it('should validate serviceId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('slot-1', 'client-1', 'loc-1', 'barber-1', '', '150.00')
    ).rejects.toThrow('serviceId is required');
  });

  it('should validate agreedPrice is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry('slot-1', 'client-1', 'loc-1', 'barber-1', 'service-1', '')
    ).rejects.toThrow('agreedPrice is required');
  });

  it('should validate end is after start when both provided', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        'client-1',
        'loc-1',
        'barber-1',
        'service-1',
        '150.00',
        '2026-01-02',
        '2026-01-01'
      )
    ).rejects.toThrow('end must be after start');
  });

  it('should parse start and end dates correctly', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00',
      '2026-06-15',
      '2026-06-20'
    );

    expect(result).toBeDefined();
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    // start should be June 15, 2026
    const startDate = result.start;
    if (!startDate) throw new Error('expected start date');
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(5); // 0-indexed, so 5 = June
    expect(startDate.getDate()).toBe(15);
    // end should be June 20, 2026
    const endDate = result.end;
    if (!endDate) throw new Error('expected end date');
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(5);
    expect(endDate.getDate()).toBe(20);
  });

  it('should pass precision through', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00',
      undefined,
      undefined,
      'premium'
    );

    expect(result).toBeDefined();
    expect(result.precision).toBe('premium');
  });
});
