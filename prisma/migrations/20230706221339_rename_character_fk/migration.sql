/*
  Warnings:

  - You are about to drop the column `gameId` on the `Character` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_gameId_fkey";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "gameId",
ADD COLUMN     "game_id" TEXT;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
