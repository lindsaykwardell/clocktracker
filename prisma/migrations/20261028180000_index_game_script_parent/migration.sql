-- One concurrent index per migration avoids an implicit multi-statement transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Game_script_id_parent_game_id_idx" ON "public"."Game" ("script_id", "parent_game_id");
