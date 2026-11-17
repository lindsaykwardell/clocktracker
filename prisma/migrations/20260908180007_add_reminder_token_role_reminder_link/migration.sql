-- Link reminders on game tokens to the reminder catalog (RoleReminder), so a
-- reminder's type (official, tracking, ...) comes from the catalog instead of
-- a copy. is_custom marks reminders the user made up themselves.
--
-- Both columns only change the table definition: no existing row is rewritten.
-- Existing reminders stay unlinked (shown like official reminders, as before)
-- until a save or the background link job links them.
ALTER TABLE "ReminderToken"
ADD COLUMN "role_reminder_id" INTEGER,
ADD COLUMN "is_custom" BOOLEAN NOT NULL DEFAULT false;

-- NOT VALID skips checking existing rows (all null anyway); a later migration
-- validates it without blocking writes. New rows are checked straight away.
ALTER TABLE "ReminderToken"
ADD CONSTRAINT "ReminderToken_role_reminder_id_fkey"
FOREIGN KEY ("role_reminder_id") REFERENCES "RoleReminder"("id")
ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
