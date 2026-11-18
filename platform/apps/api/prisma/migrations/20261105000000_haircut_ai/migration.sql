-- Phase 10A — контекст haircut-ai: SourcePhoto (референсне фото клієнта) і
-- HaircutSuggestion (одна AI-генерація). Байти фото — у приватному бакете
-- (ADR 0008), тут лише метадані, згода на AI-обробку та результат генерації.
CREATE TABLE "SourcePhoto" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "consentGrantedAt" TIMESTAMPTZ,
    "consentRevokedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "SourcePhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HaircutSuggestion" (
    "id" TEXT NOT NULL,
    "sourcePhotoId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "variantCount" INTEGER NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "failureReason" TEXT,
    "errorMessage" TEXT,
    "providerJobHandle" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,

    CONSTRAINT "HaircutSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SourcePhoto_objectKey_key" ON "SourcePhoto"("objectKey");
CREATE INDEX "SourcePhoto_ownerId_deletedAt_idx" ON "SourcePhoto"("ownerId", "deletedAt");
CREATE INDEX "SourcePhoto_ownerId_createdAt_idx" ON "SourcePhoto"("ownerId", "createdAt");

CREATE UNIQUE INDEX "HaircutSuggestion_providerJobHandle_key" ON "HaircutSuggestion"("providerJobHandle");
CREATE INDEX "HaircutSuggestion_sourcePhotoId_idx" ON "HaircutSuggestion"("sourcePhotoId");
CREATE INDEX "HaircutSuggestion_ownerId_createdAt_idx" ON "HaircutSuggestion"("ownerId", "createdAt");
CREATE INDEX "HaircutSuggestion_status_createdAt_idx" ON "HaircutSuggestion"("status", "createdAt");

ALTER TABLE "HaircutSuggestion"
    ADD CONSTRAINT "HaircutSuggestion_sourcePhotoId_fkey"
    FOREIGN KEY ("sourcePhotoId") REFERENCES "SourcePhoto"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
