-- CreateTable
CREATE TABLE "ForumThreadRead" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumThreadRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumThreadRead_user_id_idx" ON "ForumThreadRead"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumThreadRead_thread_id_user_id_key" ON "ForumThreadRead"("thread_id", "user_id");

-- AddForeignKey
ALTER TABLE "ForumThreadRead" ADD CONSTRAINT "ForumThreadRead_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadRead" ADD CONSTRAINT "ForumThreadRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
