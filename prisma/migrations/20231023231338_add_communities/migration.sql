-- CreateTable
CREATE TABLE "Community" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_date" TIMESTAMP(3),

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommunityMember" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CommunityAdmin" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityMember_AB_unique" ON "_CommunityMember"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityMember_B_index" ON "_CommunityMember"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityAdmin_AB_unique" ON "_CommunityAdmin"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityAdmin_B_index" ON "_CommunityAdmin"("B");

-- AddForeignKey
ALTER TABLE "_CommunityMember" ADD CONSTRAINT "_CommunityMember_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityMember" ADD CONSTRAINT "_CommunityMember_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityAdmin" ADD CONSTRAINT "_CommunityAdmin_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityAdmin" ADD CONSTRAINT "_CommunityAdmin_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
