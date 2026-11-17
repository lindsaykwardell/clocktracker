-- Lets reminder linking find a role by its icon without scanning Role.
-- Hash, not B-tree: custom roles can store their icon inline as a data URL,
-- which is too large for a B-tree index entry. Lookups are equality only.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Role_token_url_idx" ON "public"."Role" USING hash ("token_url");
