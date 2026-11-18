-- T-2400a: підролі адмінки (ADR 0027). `key` — стабільний ідентифікатор ролі
-- (super-admin | manager | barber), `permissions` — секції доступу, `priority` —
-- широта прав. Початкові рядки наповнює seeder (seed-admin-roles), не міграція.
CREATE TABLE "AdminRole" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" TEXT[],
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRole_key_key" ON "AdminRole"("key");
CREATE INDEX "AdminRole_priority_idx" ON "AdminRole"("priority");
