-- CreateTable
CREATE TABLE "ForumThreadSubscription" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumThreadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumThreadSubscription_user_id_idx" ON "ForumThreadSubscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumThreadSubscription_thread_id_user_id_key" ON "ForumThreadSubscription"("thread_id", "user_id");

-- AddForeignKey
ALTER TABLE "ForumThreadSubscription" ADD CONSTRAINT "ForumThreadSubscription_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadSubscription" ADD CONSTRAINT "ForumThreadSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
