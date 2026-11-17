// E2E: завантаження/видалення логотипа локації в адмінці (T-4609a).
// Мультипарт іде тим самим шляхом, що й у проді (multer memoryStorage).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildLogoApp, putLogo, seedLocationViaApi } from './admin-location-logo.e2e.setup';

describe('Admin location logo (e2e)', () => {
  let app: INestApplication;
  let media: Awaited<ReturnType<typeof buildLogoApp>>['media'];
  let id: string;

  beforeAll(async () => {
    const built = await buildLogoApp();
    app = built.app;
    media = built.media;
    id = await seedLocationViaApi(app);
  });

  afterAll(async () => app.close());

  it('завантаження light без dark: variant/alt у відповіді, darkUrl null', async () => {
    const res = await putLogo(app, id, { variant: 'mark', alt: 'Логотип Fade Podil' }).expect(200);
    expect(res.body).toMatchObject({ variant: 'mark', darkUrl: null, alt: 'Логотип Fade Podil' });
    expect(res.body.lightUrl).toContain('https://media.test/location-brand/locations/');
    expect(media.objects.size).toBe(1);
    // Адмінська картка локації віддає логотип (T-4609a).
    const one = await request(app.getHttpServer()).get(`/admin/locations/${id}`).expect(200);
    expect(one.body.logo).toMatchObject({ variant: 'mark', alt: 'Логотип Fade Podil' });
  });

  it('заміна прибирає старі обʼєкти; light+dark — два поля', async () => {
    const old = await putLogo(app, id, { variant: 'lockup', alt: 'Lockup' }).expect(200);
    const res = await putLogo(app, id, { variant: 'lockup', alt: 'Lockup 2', dark: true }).expect(
      200
    );
    expect(res.body.darkUrl).toContain('-dark.webp');
    const oldKey = old.body.lightUrl.split('/').pop() as string;
    expect(media.objects.has(oldKey)).toBe(false);
    expect(old.body.lightUrl).not.toBe(res.body.lightUrl);
    expect(media.objects.size).toBe(2);
  });

  it('400: без light, невідомий variant, порожній alt', async () => {
    await putLogo(app, id, { alt: 'x', light: false }).expect(400);
    await putLogo(app, id, { variant: 'emblem', alt: 'x' }).expect(400);
    await putLogo(app, id, { alt: '   ' }).expect(400);
  });

  it('404: логотип для невідомої локації', async () => {
    await putLogo(app, 'nope', { alt: 'x' }).expect(404);
  });

  it('видалення ідемпотентне; публічна відповідь без логотипа', async () => {
    await request(app.getHttpServer()).delete(`/admin/locations/${id}/logo`).expect(204);
    expect(media.objects.size).toBe(0);
    const publicRes = await request(app.getHttpServer()).get('/locations/clt-01').expect(200);
    expect(publicRes.body.logo).toBeNull();
    await request(app.getHttpServer()).delete(`/admin/locations/${id}/logo`).expect(204);
  });
});
