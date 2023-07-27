/*
  Warnings:

  - You are about to drop the column `name` on the `Grimoire` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_grimoire_id_fkey";

-- AlterTable
ALTER TABLE "Grimoire" DROP COLUMN "name",
ADD COLUMN     "game_id" TEXT;

-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "is_dead" SET DEFAULT false;

-- AddForeignKey
ALTER TABLE "Grimoire" ADD CONSTRAINT "Grimoire_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
