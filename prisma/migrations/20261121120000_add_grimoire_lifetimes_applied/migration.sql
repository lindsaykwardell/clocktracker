-- Set on a grimoire page that "Add page" made with the reminder lifetimes
-- applied. On such a page, a reminder whose lifetime ended there was placed
-- again, so the event engines count it as a new event.
ALTER TABLE "Grimoire"
ADD COLUMN "lifetimes_applied" BOOLEAN NOT NULL DEFAULT false;
