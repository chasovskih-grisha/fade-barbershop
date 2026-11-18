-- Блог (T-031, MNG-ADM-17): Article у контексті content. Один рядок на
-- статтю: чернетка чи опублікована, унікальний slug (SEO-URL сторінки),
-- дата публікації для стрічки, теги як масив рядків (фільтр за тегом лише
-- з пошуком — тоді окрема таблиця). Автор — рядок, а не зв'язок з identity:
-- статті пишуть засновник і барбери, профілі яких не зобов'язані бути в identity.
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverUrl" TEXT,
    "authorName" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Article_slug_key" UNIQUE ("slug"),
    CONSTRAINT "Article_status_check" CHECK ("status" IN ('draft', 'published')),
    CONSTRAINT "Article_published_check" CHECK (("status" = 'draft') OR ("publishedAt" IS NOT NULL))
);

-- Публічна стрічка: published + newest first; адмінський список: createdAt desc.
CREATE INDEX "Article_status_publishedAt_idx" ON "Article" ("status", "publishedAt" DESC);
CREATE INDEX "Article_createdAt_idx" ON "Article" ("createdAt" DESC);
