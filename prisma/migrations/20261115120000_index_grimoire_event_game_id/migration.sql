-- Keep each concurrent index in its own migration, outside a transaction.
-- IF NOT EXISTS supports databases where this index was applied operationally.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "GrimoireEvent_game_id_idx" ON "public"."GrimoireEvent" ("game_id");
