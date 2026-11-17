// E2E: публічний DTO логотипа (T-4609b): `logo` завжди присутнє в списку і
// деталях; вимкнена локація повертає active=false разом зі своїм логотипом
// (стан T-4513), а не 404.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildLogoApp, putLogo, seedLocationViaApi } from './admin-location-logo.e2e.setup';

describe('Public location logo (e2e)', () => {
  let app: INestApplication;
  let id: string;

  beforeAll(async () => {
    const built = await buildLogoApp();
    app = built.app;
    id = await seedLocationViaApi(app);
    await putLogo(app, id, { variant: 'lockup', alt: 'Логотип Fade Baumana', dark: true }).expect(
      200
    );
  });

  afterAll(async () => app.close());

  it('GET /locations/{code} віддає logo з обома полями', async () => {
    const res = await request(app.getHttpServer()).get('/locations/clt-01').expect(200);
    expect(res.body.logo).toMatchObject({
      variant: 'lockup',
      alt: 'Логотип Fade Baumana',
      darkUrl: expect.stringContaining('-dark.webp'),
    });
    expect(res.body.logo.lightUrl).toContain('https://media.test/location-brand/');
  });

  it('GET /locations віддає logo для активної локації', async () => {
    const res = await request(app.getHttpServer()).get('/locations').expect(200);
    // Код нормалізується доменом (normalizeCode → верхній регістр).
    const podil = res.body.find((l: { code: string }) => l.code.toLowerCase() === 'clt-01');
    expect(podil.logo).toMatchObject({ variant: 'lockup', alt: 'Логотип Fade Baumana' });
  });

  it('вимкнена локація: active=false і логотип на місці (T-4513)', async () => {
    await request(app.getHttpServer()).post(`/admin/locations/${id}/disable`).expect(200);
    const res = await request(app.getHttpServer()).get('/locations/clt-01').expect(200);
    expect(res.body.active).toBe(false);
    expect(res.body.logo.alt).toBe('Логотип Fade Baumana');
    // Зі списку активних зникає негайно.
    const list = await request(app.getHttpServer()).get('/locations').expect(200);
    expect(
      list.body.find((l: { code: string }) => l.code.toLowerCase() === 'clt-01')
    ).toBeUndefined();
  });
});
