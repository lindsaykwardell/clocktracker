-- CreateTable
CREATE TABLE "_CommunityJoinRequest" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityJoinRequest_AB_unique" ON "_CommunityJoinRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityJoinRequest_B_index" ON "_CommunityJoinRequest"("B");

-- AddForeignKey
ALTER TABLE "_CommunityJoinRequest" ADD CONSTRAINT "_CommunityJoinRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityJoinRequest" ADD CONSTRAINT "_CommunityJoinRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSettings"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
