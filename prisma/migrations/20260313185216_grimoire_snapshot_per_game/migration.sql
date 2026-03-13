/*
  Warnings:

  - You are about to drop the column `grimoire_id` on the `GrimoireSnapshot` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GrimoireSnapshot" DROP CONSTRAINT "GrimoireSnapshot_grimoire_id_fkey";

-- DropIndex
DROP INDEX "GrimoireSnapshot_grimoire_id_idx";

-- AlterTable
ALTER TABLE "GrimoireSnapshot" DROP COLUMN "grimoire_id";
