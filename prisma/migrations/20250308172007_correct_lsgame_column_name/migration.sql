/*
  Warnings:

  - You are about to drop the column `game_id` on the `LSGame` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,game_number]` on the table `LSGame` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `game_number` to the `LSGame` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LSGame_id_game_id_key";

-- AlterTable
ALTER TABLE "LSGame" DROP COLUMN "game_id",
ADD COLUMN     "game_number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LSGame_id_game_number_key" ON "LSGame"("id", "game_number");
