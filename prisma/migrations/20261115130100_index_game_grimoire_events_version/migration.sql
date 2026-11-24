-- Lets the fill and catch-up jobs find their games in id order without scanning Game.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Game_grimoire_events_version_id_idx" ON "public"."Game" ("grimoire_events_version", "id");
