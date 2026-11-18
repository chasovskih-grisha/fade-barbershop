// Race e2e (T-040c): інваріант 2 крісел захищений на рівні serializable-
// транзакції. single (1 крісло) — parallel нижче порогу місткості + race за
// останнє крісло; dual (2 крісла) — конфлікт ноги відкочує всю партію.
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { AppointmentPartyModule } from '../../appointment-party/appointment-party.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { DATE, buildPartyWorld, cleanupPartyWorld, seedPartyWorld } from './appointment-party-race.fixtures';
import { partyPayload } from './appointment-party-race.payload';

describe('AppointmentParty concurrency (e2e, Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const world = buildPartyWorld();
  const uid = () => uuidv7();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentPartyModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await seedPartyWorld(prisma, world);
  });

  afterAll(async () => {
    await cleanupPartyWorld(prisma, world);
    await app.close();
  });
  const post = (payload: object) =>
    request(app.getHttpServer()).post('/admin/appointment-parties').send(payload);
  const rows = (locationId: string) => prisma.booking.findMany({ where: { locationId } });
  /** Партії локації (для перевірок «нічого не записано»). */
  const partyRows = (locationId: string) =>
    prisma.appointmentParty.findMany({ where: { locationId } });
  const { locations: loc, barbers: bb } = world;
  const party = partyPayload.bind(null, world);

  test('single: parallel-партія не проходить поріг активних крісел (409, нічого не записано)', async () => {
    const response = await post(
      party({ locationId: loc.single, mode: 'parallel', father: bb.b1, son: bb.b2 })
    ).expect(HttpStatus.CONFLICT);
    expect(String(response.text)).toContain('active chairs');
    expect(await partyRows(loc.single)).toHaveLength(0);
    expect(await rows(loc.single)).toHaveLength(0);
  });

  test('dual: конфлікт ноги з walk-in відкочує всю партію (атомарність ніг)', async () => {
    await prisma.booking.create({
      data: {
        id: uid(),
        barberId: bb.b2,
        locationId: loc.dual,
        start: new Date(`${DATE}T09:50:00.000Z`),
        end: new Date(`${DATE}T10:20:00.000Z`),
        version: 0,
      },
    });
    const response = await post(
      party({ locationId: loc.dual, mode: 'sequential', father: bb.b2, son: bb.b2 })
    ).expect(HttpStatus.CONFLICT);
    expect(String(response.text)).toContain('already booked');
    expect(await partyRows(loc.dual)).toHaveLength(0);
    // Лише walk-in з підготовки; ніг партії не залишилось.
    const left = await rows(loc.dual);
    expect(left).toHaveLength(1);
    expect(left[0]?.partyId).toBeNull();
  });

  test('single: дві одночасні партії за останню крісло — 201 + 409 (race)', async () => {
    const payload = party({
      locationId: loc.single,
      mode: 'sequential',
      father: bb.b1,
      son: bb.b1,
    });
    const send = () => post(payload);
    const first = await Promise.all([send(), send()]);
    // P2034 при паралельному бігу e2e-сюїт теж дає 409 — retry за контрактом клієнта (до 4 спроб).
    let retry = first;
    for (let i = 0; retry.every((r) => r.status === HttpStatus.CONFLICT) && i < 3; i += 1) {
      retry = await Promise.all([send(), send()]);
    }
    // prettier-ignore
    expect(retry.map((response) => response.status).sort()).toEqual([HttpStatus.CREATED, HttpStatus.CONFLICT]);
    const sequential = await prisma.booking.findMany({
      where: { locationId: loc.single, fulfillmentMode: 'sequential' },
    });
    expect(sequential).toHaveLength(1);
  });
});
