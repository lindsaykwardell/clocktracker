-- AlterTable
ALTER TABLE "ForumCategory" ADD COLUMN     "group_id" TEXT;

-- CreateTable
CREATE TABLE "ForumCategoryGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumCategoryGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ForumCategory" ADD CONSTRAINT "ForumCategory_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ForumCategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
