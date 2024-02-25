-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "EventWaitlist" ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false;
