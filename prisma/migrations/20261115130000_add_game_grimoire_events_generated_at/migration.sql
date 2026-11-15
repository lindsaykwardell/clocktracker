-- Null until the grimoire events fill job (or an editor save) has generated
-- events for the game. Adding a nullable column without a default is instant.
ALTER TABLE "Game" ADD COLUMN "grimoire_events_generated_at" TIMESTAMPTZ(6);
