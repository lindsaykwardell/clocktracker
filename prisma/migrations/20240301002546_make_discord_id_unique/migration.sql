/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `UserSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_discord_id_key" ON "UserSettings"("discord_id");
