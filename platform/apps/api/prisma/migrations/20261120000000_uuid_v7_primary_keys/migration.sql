-- T-4300b: UUID v7 as primary key for all domain models (ADR 0021).
-- PK/FK columns move from text to PostgreSQL uuid; ids are generated in
-- application code (packages/domain-shared uuidv7), so no DB default remains.
-- Existing dev data holds legacy readable ids (FIXED_IDS seeds) and cannot be
-- cast: reseed the dev database (`pnpm --filter @fade/api seed:e2e`).

-- Foreign keys must be dropped before the column types change.
ALTER TABLE "Chair" DROP CONSTRAINT IF EXISTS "Chair_locationId_fkey";
ALTER TABLE "OpeningHour" DROP CONSTRAINT IF EXISTS "OpeningHour_locationId_fkey";
ALTER TABLE "LocationChannel" DROP CONSTRAINT IF EXISTS "LocationChannel_locationId_fkey";
ALTER TABLE "LocationPhoto" DROP CONSTRAINT IF EXISTS "LocationPhoto_locationId_fkey";
ALTER TABLE "ServicePrice" DROP CONSTRAINT IF EXISTS "ServicePrice_serviceId_fkey";
ALTER TABLE "ServicePrice" DROP CONSTRAINT IF EXISTS "ServicePrice_locationId_fkey";
ALTER TABLE "HaircutSuggestion" DROP CONSTRAINT IF EXISTS "HaircutSuggestion_sourcePhotoId_fkey";
ALTER TABLE "LocationLogo" DROP CONSTRAINT IF EXISTS "LocationLogo_locationId_fkey";
ALTER TABLE "BarberPhoto" DROP CONSTRAINT IF EXISTS "BarberPhoto_userId_fkey";

-- text -> uuid
-- Array default is text[]-typed: drop it, retype the column, restore as uuid[].
ALTER TABLE "AppointmentParty" ALTER COLUMN "barberIds" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "OtpChallenge" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "Session" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "Session" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "PushToken" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "PushToken" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "PushToken" ALTER COLUMN "sessionId" TYPE UUID USING "sessionId"::uuid;
ALTER TABLE "OutboxMessage" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "AppointmentActivity" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "NotificationRecord" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ClientNotificationPreference" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ClientNotificationPreference" ALTER COLUMN "clientId" TYPE UUID USING "clientId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "barberId" TYPE UUID USING "barberId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "serviceId" TYPE UUID USING "serviceId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "agreedPriceId" TYPE UUID USING "agreedPriceId"::uuid;
ALTER TABLE "AppointmentParty" ALTER COLUMN "barberIds" TYPE UUID[] USING "barberIds"::uuid[];
ALTER TABLE "AppointmentParty" ALTER COLUMN "barberIds" SET DEFAULT ARRAY[]::UUID[];
ALTER TABLE "Location" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "LocationLogo" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "LocationLogo" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "BarberPhoto" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "BarberPhoto" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "Chair" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "Chair" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "OpeningHour" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "OpeningHour" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "LocationChannel" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "LocationChannel" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "LocationPhoto" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "LocationPhoto" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "AvailabilityWindow" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "AvailabilityWindow" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "AvailabilityWindow" ALTER COLUMN "barberId" TYPE UUID USING "barberId"::uuid;
ALTER TABLE "StaffAssignment" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "StaffAssignment" ALTER COLUMN "barberId" TYPE UUID USING "barberId"::uuid;
ALTER TABLE "StaffAssignment" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "barberId" TYPE UUID USING "barberId"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "serviceId" TYPE UUID USING "serviceId"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "partyId" TYPE UUID USING "partyId"::uuid;
ALTER TABLE "Booking" ALTER COLUMN "clientId" TYPE UUID USING "clientId"::uuid;
ALTER TABLE "Service" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ServicePrice" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ServicePrice" ALTER COLUMN "serviceId" TYPE UUID USING "serviceId"::uuid;
ALTER TABLE "ServicePrice" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "BarberServiceAssignment" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "BarberServiceAssignment" ALTER COLUMN "barberId" TYPE UUID USING "barberId"::uuid;
ALTER TABLE "BarberServiceAssignment" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "BarberServiceAssignment" ALTER COLUMN "serviceId" TYPE UUID USING "serviceId"::uuid;
ALTER TABLE "LocationSlotPolicy" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "LocationSlotPolicy" ALTER COLUMN "locationId" TYPE UUID USING "locationId"::uuid;
ALTER TABLE "CatalogAudit" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "CatalogAudit" ALTER COLUMN "actorId" TYPE UUID USING "actorId"::uuid;
ALTER TABLE "Article" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "SeoBlockRecord" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ClientProfile" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ClientProfile" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "SourcePhoto" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "SourcePhoto" ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;
ALTER TABLE "HaircutSuggestion" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "HaircutSuggestion" ALTER COLUMN "sourcePhotoId" TYPE UUID USING "sourcePhotoId"::uuid;
ALTER TABLE "HaircutSuggestion" ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;

-- Foreign keys, re-created on the new uuid columns
ALTER TABLE "Chair" ADD CONSTRAINT "Chair_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "OpeningHour" ADD CONSTRAINT "OpeningHour_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "LocationChannel" ADD CONSTRAINT "LocationChannel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "LocationPhoto" ADD CONSTRAINT "LocationPhoto_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "HaircutSuggestion" ADD CONSTRAINT "HaircutSuggestion_sourcePhotoId_fkey" FOREIGN KEY ("sourcePhotoId") REFERENCES "SourcePhoto"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "LocationLogo" ADD CONSTRAINT "LocationLogo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "BarberPhoto" ADD CONSTRAINT "BarberPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE;
