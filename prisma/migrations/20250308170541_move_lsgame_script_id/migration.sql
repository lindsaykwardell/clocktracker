/*
  Warnings:

  - You are about to drop the column `ls_game_id` on the `Script` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[script_id]` on the table `LSGame` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `script_id` to the `LSGame` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Script" DROP CONSTRAINT "Script_ls_game_id_fkey";

-- DropIndex
DROP INDEX "Script_ls_game_id_key";

-- AlterTable
ALTER TABLE "LSGame" ADD COLUMN     "script_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Script" DROP COLUMN "ls_game_id";

-- CreateIndex
CREATE UNIQUE INDEX "LSGame_script_id_key" ON "LSGame"("script_id");

-- AddForeignKey
ALTER TABLE "LSGame" ADD CONSTRAINT "LSGame_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
