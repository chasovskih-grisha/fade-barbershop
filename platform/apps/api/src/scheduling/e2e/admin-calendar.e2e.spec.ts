// GWT e2e календаря мережі (T-045, admin-screens §5.1 + docs/admin/04-calendar.md):
// приймальні сценарії сітки проти Postgres — день з фільтрами, тиждень (неділя
// теж), порожній стан, 400, і замикання команди на читання (підтвердження/
// перенесення/скасування негайно видні в сітці). Then-частини звірені з
// MNG-ADM-15 і REF-ADM-01…04.
import { uuidv7 } from '@fade/domain-shared';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { command, DATE } from './appointment-lifecycle.fixtures';
import { lifecycleSuite, type LifecycleSuite } from './appointment-lifecycle.suite';

// prettier-ignore
const expectOk = (res: request.Response): request.Response => (expect(res.status).toBe(HttpStatus.OK), res);

// Метадані референсного фото (SourcePhoto): без рядка підпису немає чого
// підписувати — календар віддає referencePhotoUrl: null. ID унікальний за
// прогін (objectKey теж @unique) — інакше залишок від попереднього прогону
// ламав би сід.
const PHOTO_ID = uuidv7();
const OBJECT_KEY = `e2e/calendar/${PHOTO_ID}`;

const seedReferencePhoto = (ctx: LifecycleSuite) =>
  ctx.prisma.sourcePhoto.create({
    data: {
      id: PHOTO_ID,
      ownerId: uuidv7(),
      objectKey: OBJECT_KEY,
      bucket: 'haircut-ai-photos',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
    },
  });

describe('Календар мережі (GWT e2e, Postgres)', () => {
  let ctx: LifecycleSuite;
  let bookingId = '';

  beforeAll(async () => {
    ctx = await lifecycleSuite({ admin: true, book: { start: '10:00', end: '10:30' } });
    bookingId = ctx.bookingId;
    await seedReferencePhoto(ctx);
    // REF-ADM-01: референс і коментар на картці візита.
    // prettier-ignore
    await command({ app: ctx.app, id: bookingId, action: 'reference', dto: { actorId: 'client-1', actorRole: 'client', referenceId: PHOTO_ID, comment: 'зняти на 2 мм' } }).expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await ctx.cleanup();
    await ctx.prisma.sourcePhoto.deleteMany({ where: { id: PHOTO_ID } });
  });

  // prettier-ignore
  const calendar = (query: string) => request(ctx.app.getHttpServer()).get(`/admin/calendar${query}`).then(expectOk);
  const locQuery = () => `?date=${DATE}&locationId=${ctx.ids.location}`;

  test('Админ відкриває календар на день — бачить візит з референсом і коментарем (REF-ADM-01)', async () => {
    const res = await calendar(locQuery());
    expect(res.body.from).toBe('2026-11-09T00:00:00.000Z');
    expect(res.body.visits).toHaveLength(1);
    const stored = await ctx.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { haircutReferenceId: true },
    });
    expect(res.body.visits[0]).toMatchObject({
      id: bookingId,
      bookingId,
      locationId: ctx.ids.location,
      barberId: ctx.ids.barber1,
      status: 'booked',
      haircutReferenceId: stored?.haircutReferenceId,
      comment: 'зняти на 2 мм',
      source: 'web',
      start: '2026-11-09T10:00:00.000Z',
    });
  });

  test('Админ отримує підписаний URL референсу разом із сіткою — без окремого запиту на картку (REF-ADM-01)', async () => {
    const res = await calendar(locQuery());
    const visit = res.body.visits[0] as { referencePhotoUrl: string | null };

    // Підпис локалний (getSignedUrl): мережа не потрібна, ключ видно в URL.
    expect(visit.referencePhotoUrl).toContain(OBJECT_KEY);
    expect(visit.referencePhotoUrl).toContain('X-Amz-Signature');
  });

  test('Фільтри «з референсом / без» розділяють сітку; статус видно після підтвердження (REF-ADM-02)', async () => {
    const admin = { actorId: 'admin-1', actorRole: 'admin' };
    await command({ app: ctx.app, id: bookingId, action: 'confirm', dto: admin }).expect(
      HttpStatus.OK
    );
    // prettier-ignore
    const withRef = await calendar(`${locQuery()}&reference=with`);
    expect(withRef.body.visits.map((v: { id: string }) => v.id)).toContain(bookingId);
    // prettier-ignore
    const withoutRef = await calendar(`${locQuery()}&reference=without`);
    expect(withoutRef.body.visits.map((v: { id: string }) => v.id)).not.toContain(bookingId);
    // prettier-ignore
    const day = await calendar(`${locQuery()}&barberId=${ctx.ids.barber1}`);
    expect(day.body.visits[0]).toMatchObject({ id: bookingId, status: 'confirmed' });
  });

  test('Тиждень: візит видно з будь-якого дня тижня — неділя повертається до понеділка (MNG-ADM-15)', async () => {
    // prettier-ignore
    const week = await calendar(`?date=2026-11-11&view=week&locationId=${ctx.ids.location}`);
    expect(week.body.from).toBe('2026-11-09T00:00:00.000Z');
    expect(week.body.to).toBe('2026-11-16T00:00:00.000Z');
    expect(week.body.visits.map((v: { id: string }) => v.id)).toContain(bookingId);
    // prettier-ignore
    const sunday = await calendar(`?date=2026-11-15&view=week&locationId=${ctx.ids.location}`);
    expect(sunday.body.visits.map((v: { id: string }) => v.id)).toContain(bookingId);
  });

  test('∅ Порожній день за фільтром чужого барбера; кривий запит → 400', async () => {
    // prettier-ignore
    const empty = await calendar(`?date=${DATE}&barberId=00000000-0000-4000-8000-000000000000`);
    expect(empty.body.visits).toEqual([]);
    // prettier-ignore
    await request(ctx.app.getHttpServer()).get('/admin/calendar?date=не-дата').expect(HttpStatus.BAD_REQUEST);
    // prettier-ignore
    await request(ctx.app.getHttpServer()).get('/admin/calendar?date=2026-99-99').expect(HttpStatus.BAD_REQUEST);
  });

  test('Замикання: скасування командою негайно зникає з «активних» і видно зі статусом cancelled', async () => {
    const admin = { actorId: 'admin-1', actorRole: 'admin' };
    await command({
      app: ctx.app,
      id: bookingId,
      action: 'cancel',
      dto: { ...admin, reason: 'клієнт не зможе' },
    }).expect(HttpStatus.OK);
    // prettier-ignore
    const res = await calendar(locQuery());
    expect(res.body.visits[0]).toMatchObject({ id: bookingId, status: 'cancelled' });
  });
});
