// Dev-сид довідників (ідемпотентний): локації з координатами, годинами,
// кріслами, каналами, фото, послуги з цінами за локацію, барбери з розкладами.
// Без цього публічний флоу (nearest → slots) порожній.
//
// Режими:
//   ts-node scripts/seed-dev.ts                    — звичайний dev-сид (uuid id)
//   FADE_SEED_FIXED_IDS=1 ts-node scripts/seed-dev.ts
//                                                — детерміновані id для e2e
//                                                  (loc_KYY_01, barber_Oleh…)
// Інваріанти, яких сид мусить тримати: рівно 2 крісла на локацію (chair.ts),
// telegram/instagram — голі хендли без «@» (location-channel.ts). Гейт конфлікту
// id у FIXED_IDS-режимі — idConflict (scripts/seed/db.ts).
//
// Запуск: `pnpm seed:dev` (довідники) або `pnpm seed:e2e` = reset + фіксовані id
// (для Playwright). Мережа: Nominatim не потрібен — сид лише дані.

import { uuidv7 } from '@fade/domain-shared';
import { FIXED_IDS, idConflict, prisma, runSeed } from './seed/db';
import { LOCATIONS } from './seed/data-locations';
import { BARBERS, SERVICES } from './seed/data-catalog';
import { BLOG_POSTS } from './seed/data-blog';
import { seedLocation, seedServices } from './seed/service-location';
import { seedLocationBarbers, seedServicePrices } from './seed/prices-staff';
import { logger } from '../src/shared/seed/seed-logger';

async function main() {
  if (FIXED_IDS) logger.log('seed: FIXED-IDS режим (детерміновані id для e2e)');

  const services = await seedServices(SERVICES);
  const locations: Awaited<ReturnType<typeof seedLocation>>[] = [];
  for (const post of BLOG_POSTS) {
    await seedBlogPost(post);
  }
  for (const loc of LOCATIONS) {
    await idConflict('location', { code: loc.code }, loc.id);
    const location = await seedLocation(loc);
    await seedServicePrices(location, services);
    await seedLocationBarbers(location, BARBERS);
    locations.push(location);
    logger.log(`seeded ${loc.code} (${location.id})`);
  }
  await printSummary(locations, services);
}

/** Блог-пост сіду. Ключ ідепотентності — slug (@unique), а не id: поза
 * FIXED_IDS-режимом id() повертає undefined, і findUnique за id падав би. */
async function seedBlogPost(post: (typeof BLOG_POSTS)[number]) {
  const data = buildBlogPostData(post);
  const existing = await prisma.article.findUnique({ where: { slug: post.slug } });
  if (existing) {
    await prisma.article.update({ where: { id: existing.id }, data });
    logger.log(`blog post ${post.slug} updated`);
  } else {
    await prisma.article.create({ data: { id: uuidv7(), ...data } });
    logger.log(`blog post ${post.slug} created`);
  }
}

/** Пост сіду: поля з data-blog + опційна дата публікації (немає у довіднику —
 * дефолтуємо «зараз» для published, інакше CHECK у БД відхиляє insert). */
type SeedBlogPost = Omit<(typeof BLOG_POSTS)[number], 'id'> & { publishedAt?: Date };

function buildBlogPostData(post: (typeof BLOG_POSTS)[number]) {
  const { id: fixedId, ...rest } = post;
  // Розповсюджуємо rest напряму: проміжний Record<string, unknown> витирав
  // типи slug/title — ArticleCreateInput вимагає їх явно.
  return {
    ...(fixedId ? { id: fixedId } : {}),
    ...rest,
    ...blogPostFields(rest),
  };
}

function blogPostFields(rest: SeedBlogPost) {
  return {
    body: rest.body ?? null,
    excerpt: rest.excerpt ?? null,
    coverUrl: rest.coverUrl ?? null,
    authorName: rest.authorName ?? null,
    tags: rest.tags ?? [],
    status: rest.status ?? 'published',
    // CHECK (status = 'draft' OR publishedAt IS NOT NULL): для опублікованого
    // поста дата обовʼязкова, інакше insert падає на сид, а не на UI.
    publishedAt:
      rest.status === 'published' ? (rest.publishedAt ?? new Date()) : (rest.publishedAt ?? null),
  };
}

/** Підсумок для e2e/налагодження: машинно-читаний блок стабільних id. */
async function printSummary(
  locations: Awaited<ReturnType<typeof seedLocation>>[],
  services: Awaited<ReturnType<typeof seedServices>>
) {
  logger.log('--- seed ids ---');
  for (const loc of locations) logger.log(`location ${loc.code} ${loc.id}`);
  for (const s of services) logger.log(`service ${s.name} ${s.service.id}`);
  for (const b of BARBERS) {
    const u = await prisma.user.findUnique({ where: { phone: b.phone } });
    logger.log(`barber ${b.name} ${u?.id}`);
  }
  logger.log('--- end seed ids ---');
  logger.log('done');
}

runSeed(main);
