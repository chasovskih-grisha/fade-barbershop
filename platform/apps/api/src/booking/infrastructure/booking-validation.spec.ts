import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BookingController } from './booking.controller';
import { AvailableSlots } from './available-slots';
import { BookingReader } from './booking.reader';

describe('BookingController Zod Validation (e2e)', () => {
  let app: INestApplication;

  const mockAvailableSlots = {
    handle: jest.fn().mockResolvedValue([]),
  };

  const mockBookingReader = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: AvailableSlots, useValue: mockAvailableSlots },
        { provide: BookingReader, useValue: mockBookingReader },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts valid slot request', async () => {
    await request(app.getHttpServer())
      .post('/booking/slots')
      .send({
        locationId: 'loc-1',
        date: '2026-11-20',
        serviceId: 'srv-1',
      })
      .expect(201);
  });

  it('rejects invalid date format with 400 Bad Request and Zod details', async () => {
    const res = await request(app.getHttpServer())
      .post('/booking/slots')
      .send({
        locationId: 'loc-1',
        date: 'invalid-date',
        serviceId: 'srv-1',
      })
      .expect(400);

    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.path === 'date')).toBe(true);
  });

  it('rejects missing locationId with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/booking/slots')
      .send({
        date: '2026-11-20',
        serviceId: 'srv-1',
      })
      .expect(400);

    expect(res.body.errors.some((e: any) => e.path === 'locationId')).toBe(true);
  });
});
