-- T-4207: replay the response headers together with status and body.
-- Expand-only: existing rows keep NULL and replay with no stored headers.
ALTER TABLE "IdempotencyRecord" ADD COLUMN "responseHeaders" JSONB;