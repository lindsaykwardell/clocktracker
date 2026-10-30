ALTER TABLE "ForumThread" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ForumPost" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE "ForumSubmission" (
 "id" TEXT PRIMARY KEY, "author_id" TEXT NOT NULL REFERENCES "UserSettings"("user_id") ON DELETE CASCADE,
 "thread_id" TEXT NOT NULL REFERENCES "ForumThread"("id") ON DELETE CASCADE,
 "post_id" TEXT REFERENCES "ForumPost"("id") ON DELETE CASCADE,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('THREAD', 'POST', 'EDIT_POST', 'EDIT_TITLE')),
 "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'PUBLISHED', 'REJECTED')),
 "title" TEXT, "body" TEXT NOT NULL, "base_body" TEXT, "base_title" TEXT,
 "reason" TEXT NOT NULL, "review_reason" TEXT,
 "reviewed_by" TEXT REFERENCES "UserSettings"("user_id"), "reviewed_at" TIMESTAMPTZ,
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX CONCURRENTLY "ForumSubmission_status_created_at_idx" ON "ForumSubmission"("status", "created_at");
CREATE INDEX CONCURRENTLY "ForumSubmission_author_id_created_at_idx" ON "ForumSubmission"("author_id", "created_at");
CREATE UNIQUE INDEX CONCURRENTLY "ForumSubmission_pending_post_idx" ON "ForumSubmission"("post_id") WHERE "status" = 'PENDING' AND "post_id" IS NOT NULL;
CREATE UNIQUE INDEX CONCURRENTLY "ForumSubmission_pending_title_idx" ON "ForumSubmission"("thread_id") WHERE "status" = 'PENDING' AND "kind" = 'EDIT_TITLE';
CREATE TABLE "ForumUserPreference" (
 "user_id" TEXT NOT NULL REFERENCES "UserSettings"("user_id") ON DELETE CASCADE,
 "target_id" TEXT NOT NULL REFERENCES "UserSettings"("user_id") ON DELETE CASCADE,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('MUTE', 'BLOCK')),
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("user_id", "target_id"), CHECK ("user_id" <> "target_id")
);
CREATE INDEX CONCURRENTLY "ForumUserPreference_target_id_kind_idx" ON "ForumUserPreference"("target_id", "kind");
