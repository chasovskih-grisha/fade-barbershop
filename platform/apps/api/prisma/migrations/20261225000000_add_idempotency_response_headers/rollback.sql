-- T-4207: remove the replayed response headers column.
ALTER TABLE "IdempotencyRecord" DROP COLUMN "responseHeaders";