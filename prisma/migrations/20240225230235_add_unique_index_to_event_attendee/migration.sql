/*
  Warnings:

  - A unique constraint covering the columns `[event_id,user_id]` on the table `EventAttendee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_event_id_user_id_key" ON "EventAttendee"("event_id", "user_id");
