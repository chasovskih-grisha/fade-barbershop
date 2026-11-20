import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistService } from './waitlist.service';

describe('WaitlistService - adminCreateWaitlistEntry', () => {
  let service: WaitlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        {
          provide: WaitlistService,
          useValue: {
            createWaitlistEntry: jest.fn().mockResolvedValue({
              id: 'entry-1',
              slotId: 'slot-1',
              clientId: 'client-1',
              locationId: 'loc-1',
              barberId: 'barber-1',
              serviceId: 'service-1',
              agreedPrice: 100,
              holdExpiry: new Date(Date.now() + 15 * 60 * 1000),
              status: 'active' as const,
              holdStatus: 'active' as const,
              missedCount: 0,
              createdAt: new Date(),
              cascadeToNext: false,
            }) as any,
            holdSlot: jest.fn().mockResolvedValue({
              id: 'hold-1',
              slotId: 'slot-1',
              locationId: 'loc-1',
              barberId: '',
              holdExpiry: new Date(Date.now() + 15 * 60 * 1000),
              holdByClientId: undefined,
              holdByTime: new Date(),
              status: 'active' as const,
            }) as any,
            releaseHold: jest.fn().mockResolvedValue(undefined) as any,
            getActiveWaitlist: jest.fn().mockResolvedValue([]) as any,
            getClientHistory: jest.fn().mockResolvedValue({ clientId: 'client-1', noShowsOnWaitlist: 0, missesOnWaitlist: 0 }) as any,
            checkRateLimit: jest.fn().mockResolvedValue(true) as any,
            fulfillWaitlistEntry: jest.fn().mockResolvedValue({ id: 'booking-1' } as any) as any,
            adminCreateWaitlistEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
  });

  it('should create a waitlist entry with all required fields', async () => {
    const result = await service.adminCreateWaitlistEntry(
      'slot-1',
      'client-1',
      'loc-1',
      'barber-1',
      'service-1',
      '150.00',
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
      '150.00',
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
      'on_hold',
    );

    expect(result.status).toBe('on_hold');
  });

  it('should validate slotId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        '',
        'client-1',
        'loc-1',
        'barber-1',
        'service-1',
        '150.00',
      ),
    ).rejects.toThrow('slotId is required');
  });

  it('should validate clientId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        '',
        'loc-1',
        'barber-1',
        'service-1',
        '150.00',
      ),
    ).rejects.toThrow('clientId is required');
  });

  it('should validate locationId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        'client-1',
        '',
        'barber-1',
        'service-1',
        '150.00',
      ),
    ).rejects.toThrow('locationId is required');
  });

  it('should validate barberId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        'client-1',
        'loc-1',
        '',
        'service-1',
        '150.00',
      ),
    ).rejects.toThrow('barberId is required');
  });

  it('should validate serviceId is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        'client-1',
        'loc-1',
        'barber-1',
        '',
        '150.00',
      ),
    ).rejects.toThrow('serviceId is required');
  });

  it('should validate agreedPrice is required', async () => {
    await expect(
      service.adminCreateWaitlistEntry(
        'slot-1',
        'client-1',
        'loc-1',
        'barber-1',
        'service-1',
        '',
      ),
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
        '2026-01-01',
      ),
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
      '2026-06-20',
    );

    expect(result).toBeDefined();
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    // start should be June 15, 2026
    const startDate = result.start! as Date;
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(5); // 0-indexed, so 5 = June
    expect(startDate.getDate()).toBe(15);
    // end should be June 20, 2026
    const endDate = result.end! as Date;
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
      'premium',
    );

    expect(result).toBeDefined();
    expect(result.precision).toBe('premium');
  });
});