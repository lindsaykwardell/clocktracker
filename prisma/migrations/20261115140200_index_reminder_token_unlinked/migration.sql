-- Lets the link job find reminders that are neither linked nor custom without
-- scanning ReminderToken. Only those rows are in the index, so it empties out
-- as reminders get linked. Not expressible in schema.prisma (partial index).
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ReminderToken_unlinked_id_idx" ON "public"."ReminderToken" ("id") WHERE "role_reminder_id" IS NULL AND "is_custom" = false;
