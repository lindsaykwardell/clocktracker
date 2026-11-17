-- Checks the existing rows for the reminder catalog link without blocking reads or writes.
ALTER TABLE "ReminderToken" VALIDATE CONSTRAINT "ReminderToken_role_reminder_id_fkey";
