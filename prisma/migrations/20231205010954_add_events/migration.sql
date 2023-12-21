-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW() + interval '1.5 hours',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "player_count" INTEGER,
    "community_id" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
