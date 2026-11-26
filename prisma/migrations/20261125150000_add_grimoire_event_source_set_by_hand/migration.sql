-- The triggering character/player of an event was picked by hand in the
-- editor; the editor's sync then leaves it alone.
ALTER TABLE "GrimoireEvent" ADD COLUMN "source_set_by_hand" BOOLEAN NOT NULL DEFAULT false;
