-- Alter durationInMinutes in TestResult to double precision
ALTER TABLE "TestResult"
ALTER COLUMN "durationInMinutes" TYPE double precision USING "durationInMinutes"::double precision;

-- Set any NULLs to 0.0
UPDATE "TestResult" SET "durationInMinutes" = 0.0 WHERE "durationInMinutes" IS NULL;

-- Create index for ordering (if needed)
CREATE INDEX IF NOT EXISTS idx_testresult_duration ON "TestResult" ("durationInMinutes");
