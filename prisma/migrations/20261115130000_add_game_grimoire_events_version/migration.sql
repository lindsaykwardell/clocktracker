-- Null until the grimoire events fill job (or an editor save) has generated
-- events for the game; then the last catch-up whose rules the events include
-- (server/utils/grimoireEventsCatchUps.ts). Adding a nullable column without a
-- default is instant.
ALTER TABLE "Game" ADD COLUMN "grimoire_events_version" INTEGER;
