-- Lets deleting a catalog reminder find its linked tokens without scanning ReminderToken.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ReminderToken_role_reminder_id_idx" ON "public"."ReminderToken" ("role_reminder_id");
