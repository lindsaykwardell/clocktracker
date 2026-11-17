-- Lets reminder linking find a role by its icon without scanning Role.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Role_token_url_idx" ON "public"."Role" ("token_url");
