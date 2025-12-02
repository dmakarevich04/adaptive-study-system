-- Add created_at column to TestResult to record insertion time
ALTER TABLE "TestResult"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- For safety, set existing NULLs to now()
UPDATE "TestResult" SET created_at = now() WHERE created_at IS NULL;

-- Create an index to speed up ordering by created_at
CREATE INDEX IF NOT EXISTS idx_testresult_created_at ON "TestResult" (created_at DESC);
