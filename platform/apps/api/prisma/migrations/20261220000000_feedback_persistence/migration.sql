-- T-4451/T-4463: Feedback persistence migration
-- Adds FeedbackWindow and FeedbackSubmission models

-- Create FeedbackWindow table
CREATE TABLE "FeedbackWindow" (
  "id"               UUID NOT NULL PRIMARY KEY,
  "appointmentId"    UUID NOT NULL,
  "clientId"         UUID NOT NULL,
  "barberId"         UUID,
  "locationId"       UUID,
  "rating"           INTEGER NOT NULL DEFAULT 5,
  "text"             TEXT,
  "isPublic"         BOOLEAN NOT NULL DEFAULT false,
  "consentGiven"     BOOLEAN NOT NULL DEFAULT false,
  "photos"           JSONB NOT NULL DEFAULT '[]',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for FeedbackWindow
CREATE INDEX "idx_feedback_window_appointmentId" ON "FeedbackWindow"("appointmentId");
CREATE INDEX "idx_feedback_window_clientId" ON "FeedbackWindow"("clientId");
CREATE INDEX "idx_feedback_window_createdAt" ON "FeedbackWindow"("createdAt");

-- Create FeedbackSubmission table
CREATE TABLE "FeedbackSubmission" (
  "id"               UUID NOT NULL PRIMARY KEY,
  "feedbackId"       UUID NOT NULL,
  "adminId"          UUID NOT NULL,
  "status"           VARCHAR(20) NOT NULL DEFAULT 'new',
  "replyText"        TEXT,
  "processedAt"      TIMESTAMPTZ,
  "processedBy"      UUID,
  "showcaseModerated" BOOLEAN NOT NULL DEFAULT false,
  "moderatedBy"      UUID,
  "moderatedAt"      TIMESTAMPTZ,
  "moderationNote"   TEXT,
  "repliedAt"        TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for FeedbackSubmission
CREATE INDEX "idx_feedback_submission_feedbackId" ON "FeedbackSubmission"("feedbackId");
CREATE INDEX "idx_feedback_submission_status" ON "FeedbackSubmission"("status");
CREATE INDEX "idx_feedback_submission_createdAt" ON "FeedbackSubmission"("createdAt");

-- Add foreign key constraints (if using Prisma's automatic migration)
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackWindow"("id") ON DELETE CASCADE;
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL;