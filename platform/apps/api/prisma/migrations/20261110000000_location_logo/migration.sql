-- CreateTable (T-4609a): логотип локації — знак ідентичності точки, не галерея
CREATE TABLE "LocationLogo" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "lightKey" TEXT NOT NULL,
    "darkKey" TEXT,
    "alt" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LocationLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationLogo_locationId_key" ON "LocationLogo"("locationId");

-- AddForeignKey
ALTER TABLE "LocationLogo" ADD CONSTRAINT "LocationLogo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
