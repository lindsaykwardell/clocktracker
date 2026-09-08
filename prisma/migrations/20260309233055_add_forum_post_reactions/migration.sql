-- CreateTable
CREATE TABLE "ForumPostReaction" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPostReaction_post_id_idx" ON "ForumPostReaction"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumPostReaction_post_id_user_id_emoji_key" ON "ForumPostReaction"("post_id", "user_id", "emoji");

-- AddForeignKey
ALTER TABLE "ForumPostReaction" ADD CONSTRAINT "ForumPostReaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostReaction" ADD CONSTRAINT "ForumPostReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
