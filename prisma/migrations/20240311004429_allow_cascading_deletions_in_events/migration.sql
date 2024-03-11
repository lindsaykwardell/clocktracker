-- DropForeignKey
ALTER TABLE "EventAttendee" DROP CONSTRAINT "EventAttendee_event_id_fkey";

-- DropForeignKey
ALTER TABLE "EventDiscordPost" DROP CONSTRAINT "EventDiscordPost_event_id_fkey";

-- DropForeignKey
ALTER TABLE "EventWaitlist" DROP CONSTRAINT "EventWaitlist_event_id_fkey";

-- DropForeignKey
ALTER TABLE "EventWaitlistAttendee" DROP CONSTRAINT "EventWaitlistAttendee_waitlist_id_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AddForeignKey
ALTER TABLE "EventDiscordPost" ADD CONSTRAINT "EventDiscordPost_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlistAttendee" ADD CONSTRAINT "EventWaitlistAttendee_waitlist_id_fkey" FOREIGN KEY ("waitlist_id") REFERENCES "EventWaitlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
