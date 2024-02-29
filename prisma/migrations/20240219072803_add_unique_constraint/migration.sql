/*
  Warnings:

  - A unique constraint covering the columns `[role_id,reminder]` on the table `RoleReminder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE UNIQUE INDEX "RoleReminder_role_id_reminder_key" ON "RoleReminder"("role_id", "reminder");
