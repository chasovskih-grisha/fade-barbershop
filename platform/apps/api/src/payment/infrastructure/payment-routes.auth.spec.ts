import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
/* eslint-disable max-lines -- one HTTP auth matrix keeps role rules together */
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hashToken } from '../../identity/domain/otp-code';
import { AdminSessionGuard } from '../../identity/infrastructure/admin-session.guard';
import { ClientSessionGuard } from '../../identity/infrastructure/client-session.guard';
import { PrismaSessionRepository } from '../../identity/infrastructure/prisma-session-repository';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { SESSION_COOKIE_NAME } from '../../identity/infrastructure/session-cookie';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { depositResumeToken } from '../../shared/deposit-resume-token';
import { PaymentForm } from '../../billing/domain/payment-status.enum';
import { DepositHoldService } from '../../scheduling/application/deposit-hold.service';
import { BOOKING_PAYMENT_REPOSITORY } from '../payment.tokens';
import { DepositFlow } from '../application/deposit-flow.use-case';
import { OnsitePayment } from '../application/onsite-payment.use-case';
import { T094Refund } from '../application/refund.use-case';
import { BarberDayMoney } from '../application/barber-day-money.use-case';
import { PaymentController } from '../payment.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { BarberPaymentsController } from './barber-payments.controller';

// channel повторює реальні сесії: адмінка і платіжна команда /payment/onsite
// йдуть адмін-сесією, а /barber/payments — звичайною web-сесією барбера
// (ClientSessionGuard не пускає channel='admin').
const sessions: Record<string, { userId: string; role: string; channel: string }> = {
  'admin-token': { userId: 'admin-1', role: 'admin', channel: 'admin' },
  'barber-token': { userId: 'barber-1', role: 'barber', channel: 'admin' },
  'barber-web-token': { userId: 'barber-1', role: 'barber', channel: 'client' },
  'client-token': { userId: 'client-1', role: 'client', channel: 'admin' },
  'client-web-token': { userId: 'client-1', role: 'client', channel: 'client' },
};

type BookingStub = { id: string; barberId: string; source: string; status: string };
/** Візит, який віддає репозиторій; кожен тест виставляє свій (PAY-ONS-01). */
const bookings = new Map<string, BookingStub>();

function sessionFor(token: string) {
  const entry = sessions[token];
  if (!entry) return null;
  return {
    id: `session-${entry.userId}`,
    userId: entry.userId,
    channel: entry.channel,
    revokedAt: null,
    get active() {
      return true;
    },
    accessValid: () => true,
  };
}

async function appWithRoutes(): Promise<INestApplication> {
  const onsite = {
    execute: jest.fn(async () => ({
      booking: { id: 'booking-1' },
      outcome: 'captured',
      paidAmount: 350,
      depositAmount: 150,
      receipt: { check_id: 'чек-1', status: 'signed' },
      audit: { by: 'barber-1' },
    })),
    // Повний адмінський статус: барберський маршрут мусить звузити його до суми.
    status: jest.fn(async () => ({
      bookingId: 'booking-1',
      amountDue: 350,
      depositAmount: 150,
      finalPrice: 500,
      outstanding: 350,
      paymentStatus: 'unpaid',
      receipt: null,
    })),
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [PaymentController, AdminPaymentsController, BarberPaymentsController],
    providers: [
      { provide: APP_GUARD, useClass: AdminSessionGuard },
      ClientSessionGuard,
      {
        provide: PrismaSessionRepository,
        useValue: {
          findByTokenHash: jest.fn(async (hash: string) => {
            const token = Object.keys(sessions).find((value) => hashToken(value) === hash);
            return token ? sessionFor(token) : null;
          }),
        },
      },
      {
        provide: PrismaUserRepository,
        useValue: {
          findById: jest.fn(async (id: string) => {
            const entry = Object.values(sessions).find((value) => value.userId === id);
            return entry ? { id, role: entry.role, active: true } : null;
          }),
        },
      },
      {
        provide: PrismaService,
        useValue: {
          user: {
            findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
              const entry = Object.values(sessions).find((value) => value.userId === where.id);
              return entry ? { id: where.id, role: entry.role, active: true } : null;
            }),
          },
        },
      },
      {
        provide: BOOKING_PAYMENT_REPOSITORY,
        useValue: { findById: jest.fn(async (id: string) => bookings.get(id) ?? null) },
      },
      { provide: DepositHoldService, useValue: { find: jest.fn(async () => null) } },
      { provide: DepositFlow, useValue: {} },
      { provide: OnsitePayment, useValue: onsite },
      {
        provide: T094Refund,
        useValue: { retryRefund: jest.fn(), refundStatus: jest.fn() },
      },
      {
        provide: BarberDayMoney,
        useValue: {
          execute: jest.fn(async (barberId: string, date: string) =>
            barberId === 'barber-1' && /^\d{4}-\d{2}-\d{2}$/.test(date)
              ? { date, visits: 1, completed: 1, expected: 500, collected: 450, outstanding: 50,
                  byForm: { cash: 300, pos: 0, card: 150, certificate: 0 } }
              : null
          ),
        },
      },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return app;
}

describe('payment route authorization', () => {
  let app: INestApplication;

  beforeEach(() => {
    bookings.clear();
    bookings.set('booking-1', {
      id: 'booking-1',
      barberId: 'barber-1',
      source: 'walk_in',
      status: 'completed',
    });
  });

  beforeAll(async () => {
    process.env.DEPOSIT_RESUME_SECRET = 'test-resume-secret';
    app = await appWithRoutes();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.DEPOSIT_RESUME_SECRET;
  });

  it('keeps the deposit resume token to the anonymous deposit read', async () => {
    const server = app.getHttpServer();
    const token = depositResumeToken('booking-1');

    // Не сесія: жоден барберський чи стафовий маршрут його не приймає.
    await request(server)
      .get('/barber/payments/bookings/booking-1/onsite')
      .set('x-deposit-resume-token', token)
      .expect(401);
    await request(server)
      .post('/barber/payments/onsite')
      .set('x-deposit-resume-token', token)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(401);
    await request(server)
      .post('/payment/onsite')
      .set('x-deposit-resume-token', token)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(401);

    // Єдине, що токен відкриває, — депозит анонімного запису.
    await request(server)
      .get('/payment/bookings/booking-1/deposit')
      .set('x-deposit-resume-token', token)
      .expect(200);
  });

  it('does not leave refund retry or status routes public', async () => {
    await request(app.getHttpServer()).post('/payment/refunds/refund-1/retry').expect(401);
    await request(app.getHttpServer()).get('/payment/refunds/refund-1').expect(401);
    await request(app.getHttpServer())
      .post('/payment/refunds')
      .send({ bookingId: 'b1' })
      .expect(401);
  });

  it('admits barbers only to on-site payment and not admin payment routes', async () => {
    const server = app.getHttpServer();
    const cookie = `${SESSION_COOKIE_NAME}=barber-token`;
    await request(server)
      .post('/payment/onsite')
      .set('Cookie', cookie)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(200);
    await request(server)
      .post('/admin/payments/onsite')
      .set('Cookie', cookie)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(403);
  });

  it('lets a barber mark their own completed walk-in', async () => {
    await request(app.getHttpServer())
      .post('/barber/payments/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(201);
  });

  it('gives a barber only the amount due and state — not the admin payment card', async () => {
    const res = await request(app.getHttpServer())
      .get('/barber/payments/bookings/booking-1/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .expect(200);

    expect(res.body).toEqual({ bookingId: 'booking-1', amountDue: 350, paymentStatus: 'unpaid' });
  });

  it('refuses a barber marking their own online visit — the admin marks that remainder', async () => {
    bookings.set('booking-1', {
      id: 'booking-1',
      barberId: 'barber-1',
      source: 'client_web',
      status: 'completed',
    });
    await request(app.getHttpServer())
      .post('/barber/payments/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(403);
  });

  it('refuses a walk-in the barber has not completed yet', async () => {
    bookings.set('booking-1', {
      id: 'booking-1',
      barberId: 'barber-1',
      source: 'walk_in',
      status: 'in_progress',
    });
    await request(app.getHttpServer())
      .post('/barber/payments/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(409);
  });

  it("refuses a barber marking another barber's visit", async () => {
    bookings.set('booking-1', {
      id: 'booking-1',
      barberId: 'barber-2',
      source: 'walk_in',
      status: 'completed',
    });
    await request(app.getHttpServer())
      .post('/barber/payments/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(403);
  });

  it('lets an admin mark the remainder of an online visit', async () => {
    bookings.set('booking-1', {
      id: 'booking-1',
      barberId: 'barber-1',
      source: 'client_web',
      status: 'completed',
    });
    await request(app.getHttpServer())
      .post('/admin/payments/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=admin-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.POS })
      .expect(201);
  });

  it('gives a barber only their own money for the day', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/barber/payments/day-summary?date=2026-11-26')
      .set('Cookie', `${SESSION_COOKIE_NAME}=barber-web-token`)
      .expect(200);

    expect(res.body).toMatchObject({ date: '2026-11-26', collected: 450, outstanding: 50 });

    // Клієнтська веб-сесія: гвард пускає, роль — ні.
    await request(server)
      .get('/barber/payments/day-summary?date=2026-11-26')
      .set('Cookie', `${SESSION_COOKIE_NAME}=client-web-token`)
      .expect(403);
    await request(server).get('/barber/payments/day-summary?date=2026-11-26').expect(401);
  });

  it('keeps clients out of on-site payment', async () => {
    await request(app.getHttpServer())
      .post('/payment/onsite')
      .set('Cookie', `${SESSION_COOKIE_NAME}=client-token`)
      .send({ bookingId: 'booking-1', form: PaymentForm.CASH })
      .expect(403);
  });
});
