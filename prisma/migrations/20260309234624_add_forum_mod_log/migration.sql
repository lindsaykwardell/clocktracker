-- CreateTable
CREATE TABLE "ForumModLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumModLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumModLog_created_at_idx" ON "ForumModLog"("created_at");

-- AddForeignKey
ALTER TABLE "ForumModLog" ADD CONSTRAINT "ForumModLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
