// E2E помилки CMS блогу (T-031): дубль slug і невалідний ввід.

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createContentE2eApp, e2eDraft } from './content-e2e-app';

describe('Blog flow errors (e2e, T-031)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createContentE2eApp());
    await request(app.getHttpServer()).post('/admin/content/articles').send(e2eDraft).expect(201);
  });

  afterAll(async () => app.close());

  it('дубль URL → 409 з кодом помилки (CMS показує підказку)', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/content/articles')
      .send({ ...e2eDraft, title: 'Інша стаття' })
      .expect(409);
    expect(response.body.code).toBe('ARTICLE_SLUG_TAKEN');
  });

  it('неповна стаття → 400 INVALID_ARTICLE_INPUT, невідома → 404', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/admin/content/articles')
      .send({ ...e2eDraft, body: '' })
      .expect(400);
    expect(invalid.body.code).toBe('INVALID_ARTICLE_INPUT');
    await request(app.getHttpServer()).get('/admin/content/articles/art-404').expect(404);
  });
});
