-- CreateTable
CREATE TABLE "ForumPostReport" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPostReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPostReport_post_id_idx" ON "ForumPostReport"("post_id");

-- CreateIndex
CREATE INDEX "ForumPostReport_resolved_idx" ON "ForumPostReport"("resolved");

-- AddForeignKey
ALTER TABLE "ForumPostReport" ADD CONSTRAINT "ForumPostReport_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostReport" ADD CONSTRAINT "ForumPostReport_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostReport" ADD CONSTRAINT "ForumPostReport_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
