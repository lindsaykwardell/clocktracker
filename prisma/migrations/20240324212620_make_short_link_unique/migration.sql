/*
  Warnings:

  - A unique constraint covering the columns `[short_link]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE UNIQUE INDEX "Event_short_link_key" ON "Event"("short_link");
