-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN     "discord_user_id" TEXT;

-- AlterTable
ALTER TABLE "EventWaitlistAttendee" ADD COLUMN     "discord_user_id" TEXT;
