// T-4439: адаптер перекладає таблиці в лічильники дашборда. Перевіряємо
// семантику доставки (failed не входить у спроби) і підрахунок 5xx.
import { PrismaLaunchMetricsSource } from './prisma-launch-metrics.source';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import type { HttpMetrics } from '../../shared/metrics/http-metrics';

function fakePrisma(overrides: Record<string, unknown> = {}): PrismaService {
  const counts = [2, 5, 9, 1, 4, 3];
  let index = 0;
  return {
    location: { count: jest.fn(async () => counts[index++] ?? 0) },
    clientProfile: { count: jest.fn(async () => counts[index++] ?? 0) },
    appointmentParty: { count: jest.fn(async () => counts[index++] ?? 0) },
    booking: { count: jest.fn(async () => counts[index++] ?? 0) },
    outboxMessage: { count: jest.fn(async () => counts[index++] ?? 0) },
    notificationRecord: {
      groupBy: jest.fn(async () => [
        { channel: 'sms', status: 'sent', _count: { _all: 90 } },
        { channel: 'sms', status: 'skipped', _count: { _all: 5 } },
        { channel: 'sms', status: 'failed', _count: { _all: 4 } },
        { channel: 'push', status: 'sent', _count: { _all: 30 } },
        { channel: 'push', status: 'skipped', _count: { _all: 2 } },
      ]),
    },
    ...overrides,
  } as unknown as PrismaService;
}

const http = {
  snapshot: () => ({
    routes: {
      booking: { '2xx': 80, '5xx': 5 },
      identity: { '2xx': 10, '4xx': 5 },
    },
    bookingSlow: 0,
  }),
} as unknown as HttpMetrics;

describe('PrismaLaunchMetricsSource (T-4439)', () => {
  it('перекладає таблиці в лічильники', async () => {
    const source = new PrismaLaunchMetricsSource(fakePrisma(), http);
    const counters = await source.countersBetween(
      new Date('2026-11-10T00:00:00.000Z'),
      new Date('2026-11-17T00:00:00.000Z')
    );
    expect(counters.locationsOnline).toBe(2);
    expect(counters.clientsCreated).toBe(5);
    expect(counters.bookingsCreated).toBe(9);
    expect(counters.noShows).toBe(1);
    expect(counters.paymentsCaptured).toBe(4);
    expect(counters.receiptsIssued).toBe(3);
  });

  it('failed-доставки не входять у спроби, skipped входять', async () => {
    const source = new PrismaLaunchMetricsSource(fakePrisma(), http);
    const counters = await source.countersBetween(new Date(0), new Date());
    expect(counters.smsDelivered).toBe(90);
    expect(counters.smsAttempted).toBe(95);
    expect(counters.pushDelivered).toBe(30);
    expect(counters.pushAttempted).toBe(32);
  });

  it('5xx входять і в помилки, і в загальну кількість запитів', async () => {
    const source = new PrismaLaunchMetricsSource(fakePrisma(), http);
    const counters = await source.countersBetween(new Date(0), new Date());
    expect(counters.serverErrors).toBe(5);
    expect(counters.httpRequests).toBe(100);
  });

  it('шукає гроші й чеки за типами подій outbox', async () => {
    const prisma = fakePrisma();
    const source = new PrismaLaunchMetricsSource(prisma, http);
    await source.countersBetween(new Date(0), new Date());
    const calls = (prisma.outboxMessage.count as jest.Mock).mock.calls;
    expect(calls[0][0].where.type).toBe('billing.payment.captured');
    expect(calls[1][0].where.type).toBe('billing.receipt.issued');
  });
});
