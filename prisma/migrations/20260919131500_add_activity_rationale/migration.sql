-- Add optional rationale field to Activity for capturing stage-change decisions.
-- Populated only when a stage change occurs (APPROVED / REJECTED typically).
ALTER TABLE "Activity" ADD COLUMN "rationale" VARCHAR(1000);
