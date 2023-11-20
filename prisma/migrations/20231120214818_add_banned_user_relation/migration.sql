-- CreateTable
CREATE TABLE "_CommunityBanned" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityBanned_AB_unique" ON "_CommunityBanned"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityBanned_B_index" ON "_CommunityBanned"("B");

-- AddForeignKey
ALTER TABLE "_CommunityBanned" ADD CONSTRAINT "_CommunityBanned_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityBanned" ADD CONSTRAINT "_CommunityBanned_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
