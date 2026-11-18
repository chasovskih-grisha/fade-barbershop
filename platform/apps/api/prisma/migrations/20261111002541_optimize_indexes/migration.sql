-- DropIndex if exists
DROP INDEX IF EXISTS "BarberServiceAssignment_barberId_locationId_serviceId_idx";
DROP INDEX IF EXISTS "ClientNotificationPreference_clientId_idx";
DROP INDEX IF EXISTS "idx_location_slot_policy";
DROP INDEX IF EXISTS "SeoBlockRecord_entityType_entityId_idx";
DROP INDEX IF EXISTS "StaffAssignment_barberId_idx";
DROP INDEX IF EXISTS "User_role_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_clientId_status_idx" ON "Booking"("clientId", "status");
