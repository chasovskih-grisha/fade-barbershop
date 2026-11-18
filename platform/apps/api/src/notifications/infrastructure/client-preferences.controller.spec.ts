import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ClientPreferencesController } from './client-preferences.controller';
import { PrismaClientPreferences } from './prisma-client-preferences';

describe('ClientPreferencesController', () => {
  let app: INestApplication;
  let preferencesMock: {
    getPreferences: jest.Mock;
    updatePreferences: jest.Mock;
  };

  beforeAll(async () => {
    preferencesMock = {
      getPreferences: jest.fn().mockResolvedValue({
        clientId: 'client-1',
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        loyaltyOptOut: false,
        reminderOptOut: false,
      }),
      updatePreferences: jest.fn().mockImplementation((clientId, data) => Promise.resolve({
        clientId,
        smsEnabled: data.smsEnabled ?? true,
        emailEnabled: data.emailEnabled ?? true,
        pushEnabled: data.pushEnabled ?? true,
        loyaltyOptOut: data.loyaltyOptOut ?? false,
        reminderOptOut: data.reminderOptOut ?? false,
      })),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ClientPreferencesController],
      providers: [
        {
          provide: PrismaClientPreferences,
          useValue: preferencesMock,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets client notification preferences', async () => {
    const res = await request(app.getHttpServer())
      .get('/client/notifications/preferences/client-1')
      .expect(200);

    expect(res.body).toEqual({
      clientId: 'client-1',
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      loyaltyOptOut: false,
      reminderOptOut: false,
    });
    expect(preferencesMock.getPreferences).toHaveBeenCalledWith('client-1');
  });

  it('updates client notification preferences', async () => {
    const res = await request(app.getHttpServer())
      .put('/client/notifications/preferences/client-1')
      .send({ smsEnabled: false, reminderOptOut: true })
      .expect(200);

    expect(res.body).toEqual({
      clientId: 'client-1',
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: true,
      loyaltyOptOut: false,
      reminderOptOut: true,
    });
    expect(preferencesMock.updatePreferences).toHaveBeenCalledWith('client-1', {
      smsEnabled: false,
      reminderOptOut: true,
    });
  });
});
