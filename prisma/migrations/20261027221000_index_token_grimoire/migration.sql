-- Keep each concurrent index in its own migration, outside a transaction.
-- IF NOT EXISTS supports databases where this index was applied operationally.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Token_grimoire_id_idx" ON "public"."Token" ("grimoire_id");
