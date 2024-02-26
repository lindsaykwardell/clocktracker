-- DropIndex
DROP INDEX "EventAttendee_event_id_user_id_key";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';
