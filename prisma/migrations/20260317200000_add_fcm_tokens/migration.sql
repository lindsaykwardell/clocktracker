-- CreateTable
CREATE TABLE "FcmToken" (
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FcmToken_pkey" PRIMARY KEY ("user_id","token")
);

-- CreateIndex
CREATE INDEX CONCURRENTLY "FcmToken_user_id_idx" ON "FcmToken"("user_id");

-- AddForeignKey
ALTER TABLE "FcmToken" ADD CONSTRAINT "FcmToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
