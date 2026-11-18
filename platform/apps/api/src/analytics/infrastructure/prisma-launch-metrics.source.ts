// Prisma-адаптер дашборда запуску (T-4439). Джерела — наявні таблиці, без
// нової схеми: клієнти (CRM), записи (appointment-party), no-show (scheduling),
// гроші й чеки (outbox billing.*), доставка (NotificationRecord), 5xx
// (HttpMetrics, in-process SLI T-4204).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { HttpMetrics } from '../../shared/metrics/http-metrics';
import type { LaunchCounters } from '../domain/launch-dashboard';
import type { LaunchMetricsSource } from '../application/launch-dashboard.ports';

interface DeliveryRow {
  channel: string;
  status: string;
  _count: { _all: number };
}

const channel = (rows: DeliveryRow[], name: string) => {
  const own = rows.filter((row) => row.channel === name);
  const delivered = own.filter((row) => row.status === 'sent').reduce(sum, 0);
  const attempted = own.filter((row) => row.status !== 'failed').reduce(sum, 0);
  return { delivered, attempted };
};

const sum = (total: number, row: DeliveryRow): number => total + row._count._all;

const httpTotals = (snapshot: ReturnType<HttpMetrics['snapshot']>) => {
  let requests = 0;
  let serverErrors = 0;
  for (const codes of Object.values(snapshot.routes)) {
    for (const [code, value] of Object.entries(codes)) {
      if (code === '5xx') {
        serverErrors += value;
        requests += value;
      } else if (code === '2xx' || code === '3xx' || code === '4xx') {
        requests += value;
      }
    }
  }
  return { requests, serverErrors };
};

@Injectable()
export class PrismaLaunchMetricsSource implements LaunchMetricsSource {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpMetrics
  ) {}

  async countersBetween(from: Date, to: Date): Promise<LaunchCounters> {
    const inRange = { gte: from, lte: to };
    const [locationsOnline, clientsCreated, bookingsCreated, noShows, paymentsCaptured, receiptsIssued, deliveries] =
      await Promise.all([
        this.prisma.location.count({ where: { active: true } }),
        this.prisma.clientProfile.count({ where: { createdAt: inRange } }),
        this.prisma.appointmentParty.count({ where: { createdAt: inRange } }),
        this.prisma.booking.count({ where: { status: 'no_show', start: inRange } }),
        this.prisma.outboxMessage.count({
          where: { type: 'billing.payment.captured', createdAt: inRange },
        }),
        this.prisma.outboxMessage.count({
          where: { type: 'billing.receipt.issued', createdAt: inRange },
        }),
        this.prisma.notificationRecord.groupBy({
          by: ['channel', 'status'],
          where: { sentAt: inRange },
          _count: { _all: true },
        }),
      ]);
    const sms = channel(deliveries as DeliveryRow[], 'sms');
    const push = channel(deliveries as DeliveryRow[], 'push');
    const http = httpTotals(this.http.snapshot());
    return {
      locationsOnline,
      clientsCreated,
      bookingsCreated,
      noShows,
      paymentsCaptured,
      receiptsIssued,
      smsAttempted: sms.attempted,
      smsDelivered: sms.delivered,
      pushAttempted: push.attempted,
      pushDelivered: push.delivered,
      httpRequests: http.requests,
      serverErrors: http.serverErrors,
    };
  }
}
