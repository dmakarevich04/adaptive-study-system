-- Fix ModulePassed unique constraint
-- The constraint should be on (userId, moduleId) combination, not just userId
-- This allows a user to have ModulePassed records for multiple modules

-- Drop the incorrect unique constraint on userId only
ALTER TABLE "ModulePassed" DROP CONSTRAINT IF EXISTS "ModulePassed_userId_key";

-- Add the correct unique constraint on (userId, moduleId) combination
ALTER TABLE "ModulePassed" ADD CONSTRAINT "ModulePassed_userId_moduleId_key" UNIQUE ("userId", "moduleId");
