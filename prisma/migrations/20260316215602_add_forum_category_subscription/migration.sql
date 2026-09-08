-- CreateTable
CREATE TABLE "ForumCategorySubscription" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumCategorySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumCategorySubscription_user_id_idx" ON "ForumCategorySubscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategorySubscription_category_id_user_id_key" ON "ForumCategorySubscription"("category_id", "user_id");

-- AddForeignKey
ALTER TABLE "ForumCategorySubscription" ADD CONSTRAINT "ForumCategorySubscription_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ForumCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCategorySubscription" ADD CONSTRAINT "ForumCategorySubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
