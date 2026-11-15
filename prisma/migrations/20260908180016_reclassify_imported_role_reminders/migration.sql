-- Imported/custom-script reminder definitions used to be stored as CUSTOM.
-- Reclassify only RoleReminder rows; ReminderToken CUSTOM remains manual ad-hoc reminders.
UPDATE "RoleReminder"
SET "type" = 'IMPORTED'::"ReminderType"
WHERE "type" = 'CUSTOM'::"ReminderType";
