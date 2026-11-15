CREATE INDEX CONCURRENTLY IF NOT EXISTS "KoFiPayment_user_id_expires_at_idx" ON "public"."KoFiPayment" ("user_id", "expires_at");
