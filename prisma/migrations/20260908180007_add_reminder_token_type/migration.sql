-- Allow reminder tokens saved on game tokens to carry source typing for styling
-- and analytics parity with RoleReminder.
ALTER TABLE "ReminderToken"
ADD COLUMN "type" "ReminderType";

-- Backfill from role reminder type when token role + reminder matches.
-- If no match exists, default to CUSTOM.
UPDATE "ReminderToken"
SET "type" = COALESCE(
  (
    SELECT rr."type"
    FROM "Token" t
    JOIN "RoleReminder" rr
      ON rr."role_id" = t."role_id"
     AND rr."reminder" = "ReminderToken"."reminder"
    WHERE t."id" = "ReminderToken"."token_id"
    LIMIT 1
  ),
  'CUSTOM'::"ReminderType"
)
WHERE "type" IS NULL;

ALTER TABLE "ReminderToken"
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'CUSTOM';
