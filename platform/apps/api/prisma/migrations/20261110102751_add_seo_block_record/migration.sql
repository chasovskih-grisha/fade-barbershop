-- CreateTable
CREATE TABLE "SeoBlockRecord" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT,
    "faq" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SeoBlockRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeoBlockRecord_entityType_entityId_idx" ON "SeoBlockRecord"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoBlockRecord_entityType_entityId_key" ON "SeoBlockRecord"("entityType", "entityId");
