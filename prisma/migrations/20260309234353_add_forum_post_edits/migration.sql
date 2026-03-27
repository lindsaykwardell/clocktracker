-- CreateTable
CREATE TABLE "ForumPostEdit" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "previous_body" TEXT NOT NULL,
    "edited_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPostEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPostEdit_post_id_idx" ON "ForumPostEdit"("post_id");

-- AddForeignKey
ALTER TABLE "ForumPostEdit" ADD CONSTRAINT "ForumPostEdit_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostEdit" ADD CONSTRAINT "ForumPostEdit_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
