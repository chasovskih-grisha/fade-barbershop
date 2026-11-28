-- T-4445: блок «рекомендуємо» на головній/у кабінеті.
-- Конфіг один на локацію (locationId NULL — мережевий дефолт) плюс добові
-- лічильники показів/кліків для аналітики блоку.

CREATE TABLE "RecommendedServicesConfig" (
    "id" TEXT NOT NULL,
    "locationId" UUID,
    "mode" TEXT NOT NULL DEFAULT 'top-week',
    "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limit" INTEGER NOT NULL DEFAULT 4,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendedServicesConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendedServiceMetric" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "serviceId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecommendedServiceMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecommendedServicesConfig_locationId_key" ON "RecommendedServicesConfig"("locationId");
CREATE UNIQUE INDEX "RecommendedServiceMetric_day_serviceId_kind_key" ON "RecommendedServiceMetric"("day", "serviceId", "kind");
CREATE INDEX "RecommendedServiceMetric_day_kind_idx" ON "RecommendedServiceMetric"("day", "kind");
