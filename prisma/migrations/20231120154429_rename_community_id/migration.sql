/*
  Warnings:

  - You are about to drop the column `communityId` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_communityId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "communityId",
ADD COLUMN     "community_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
