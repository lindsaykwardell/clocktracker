/*
  Warnings:

  - You are about to drop the column `game_id` on the `Grimoire` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_GameToGrimoire" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GameToGrimoire_AB_unique" ON "_GameToGrimoire"("A", "B");

-- CreateIndex
CREATE INDEX "_GameToGrimoire_B_index" ON "_GameToGrimoire"("B");

-- AddForeignKey
ALTER TABLE "_GameToGrimoire" ADD CONSTRAINT "_GameToGrimoire_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGrimoire" ADD CONSTRAINT "_GameToGrimoire_B_fkey" FOREIGN KEY ("B") REFERENCES "Grimoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Select all current data from "Grimoire".game_id and insert it into "_GameToGrimoire"
INSERT INTO "_GameToGrimoire" ("A", "B")
SELECT "game_id", "id" FROM "Grimoire";

-- DropForeignKey
ALTER TABLE "Grimoire" DROP CONSTRAINT "Grimoire_game_id_fkey";

-- AlterTable
ALTER TABLE "Grimoire" DROP COLUMN "game_id";