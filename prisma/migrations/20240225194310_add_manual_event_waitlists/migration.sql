-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateTable
CREATE TABLE "EventWaitlist" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWaitlistAttendee" (
    "id" SERIAL NOT NULL,
    "waitlist_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWaitlistAttendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlistAttendee" ADD CONSTRAINT "EventWaitlistAttendee_waitlist_id_fkey" FOREIGN KEY ("waitlist_id") REFERENCES "EventWaitlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlistAttendee" ADD CONSTRAINT "EventWaitlistAttendee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
