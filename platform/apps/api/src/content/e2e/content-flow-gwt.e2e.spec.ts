// E2E GWT-флоу блогу (T-031, MNG-ADM-17): HTTP-контракт публічного API й CMS
// разом. Репозиторій/outbox — фейки портів, решта (контролери, фільтр помилок,
// мапінг DTO) — справжні: тест ловить розбіжність між ендпоінтом і клієнтом.

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createContentE2eApp, e2eDraft } from './content-e2e-app';
import type { FakeOutbox } from '../application/content.fakes';

describe('Blog flow (e2e, T-031)', () => {
  let app: INestApplication;
  let outbox: FakeOutbox;

  beforeAll(async () => {
    ({ app, outbox } = await createContentE2eApp());
  });

  afterAll(async () => app.close());

  const draft = e2eDraft;

  it('чернетка створюється, але на сайті ще не видно', async () => {
    const created = await request(app.getHttpServer())
      .post('/admin/content/articles')
      .send(draft)
      .expect(201);
    expect(created.body.slug).toBe('strizhka-po-kyivsku');

    const list = await request(app.getHttpServer()).get('/content/articles').expect(200);
    expect(list.body).toEqual([]);
    expect(outbox.types()).toEqual(['content.article.drafted']);
  });

  it('після публікації стаття з’являється на сайті за URL і в стрічці', async () => {
    const admin = await request(app.getHttpServer()).get('/admin/content/articles').expect(200);
    const { id } = admin.body[0];

    const published = await request(app.getHttpServer())
      .post(`/admin/content/articles/${id}/publish`)
      .expect(200);
    expect(published.body.publishedAt).toBe('2026-09-20T09:00:00.000Z');

    const feed = await request(app.getHttpServer()).get('/content/articles').expect(200);
    expect(feed.body).toHaveLength(1);
    expect(feed.body[0]).toMatchObject({
      slug: 'strizhka-po-kyivsku',
      title: 'Стрижка по-київськи',
    });
    expect(feed.body[0].body).toBeUndefined();

    const article = await request(app.getHttpServer())
      .get('/content/articles/strizhka-po-kyivsku')
      .expect(200);
    expect(article.body).toMatchObject({
      status: 'published',
      body: 'Що це за стиль.',
      tags: ['стиль'],
    });
  });

  it('зняття публікації прибирає статтю із сайту, але не з адмінки', async () => {
    const admin = await request(app.getHttpServer()).get('/admin/content/articles').expect(200);
    const { id } = admin.body[0];

    await request(app.getHttpServer()).post(`/admin/content/articles/${id}/unpublish`).expect(200);
    await request(app.getHttpServer()).get('/content/articles/strizhka-po-kyivsku').expect(404);
    expect((await request(app.getHttpServer()).get('/content/articles').expect(200)).body).toEqual(
      []
    );
    expect(
      (await request(app.getHttpServer()).get('/admin/content/articles').expect(200)).body
    ).toHaveLength(1);
  });
});
