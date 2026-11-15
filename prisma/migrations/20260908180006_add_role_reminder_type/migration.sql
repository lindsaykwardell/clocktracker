-- Add reminder source typing so app-added tracking reminders can coexist with
-- official game reminders and user/custom-script reminders.
CREATE TYPE "ReminderType" AS ENUM ('OFFICIAL', 'TRACKING', 'CUSTOM');

ALTER TABLE "RoleReminder"
ADD COLUMN "type" "ReminderType";

-- Existing reminders on custom roles should be treated as custom.
UPDATE "RoleReminder"
SET "type" = 'CUSTOM'
WHERE "role_id" IN (
  SELECT "id"
  FROM "Role"
  WHERE "custom_role" = true
);

-- Existing reminders on official roles default to official.
UPDATE "RoleReminder"
SET "type" = 'OFFICIAL'
WHERE "type" IS NULL;

ALTER TABLE "RoleReminder"
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'OFFICIAL';
