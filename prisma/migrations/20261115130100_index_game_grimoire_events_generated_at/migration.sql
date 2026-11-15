-- Lets the fill job find unprocessed games in id order without scanning Game.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Game_grimoire_events_generated_at_id_idx" ON "public"."Game" ("grimoire_events_generated_at", "id");
