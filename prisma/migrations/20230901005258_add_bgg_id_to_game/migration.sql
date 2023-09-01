/*
  Warnings:

  - A unique constraint covering the columns `[bgg_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "bgg_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Game_bgg_id_key" ON "Game"("bgg_id");
