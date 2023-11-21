/*
  Warnings:

  - You are about to drop the column `community` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" 
ADD COLUMN     "communityId" INTEGER,
ADD COLUMN     "community_name" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate data
UPDATE "Game" SET "community_name" = "community";
ALTER TABLE "Game" DROP COLUMN "community";
