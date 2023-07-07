/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `UserSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_username_key" ON "UserSettings"("username");
