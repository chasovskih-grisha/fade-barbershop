-- Add indexes for User role and active status filtering
CREATE INDEX IF NOT EXISTS "User_role_active_idx" ON "User"("role", "active");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
