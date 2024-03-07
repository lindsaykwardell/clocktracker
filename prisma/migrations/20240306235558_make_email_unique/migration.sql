/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `UserSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_email_key" ON "UserSettings"("email");
