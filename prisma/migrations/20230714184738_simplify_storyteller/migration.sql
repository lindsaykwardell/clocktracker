/*
  Warnings:

  - You are about to drop the column `storyteller_id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `Storyteller` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_storyteller_id_fkey";

-- DropForeignKey
ALTER TABLE "Storyteller" DROP CONSTRAINT "Storyteller_userSettingsUser_id_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "storyteller_id",
ADD COLUMN     "storyteller" TEXT;

-- DropTable
DROP TABLE "Storyteller";
