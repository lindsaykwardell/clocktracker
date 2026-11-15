-- Persist reminder-origin metadata for inferred status events so multiple
-- OTHER reminders (e.g. Fortune Teller Yes vs Red Herring) are distinguishable.
ALTER TABLE "GrimoireEvent"
ADD COLUMN "status_source" TEXT;
