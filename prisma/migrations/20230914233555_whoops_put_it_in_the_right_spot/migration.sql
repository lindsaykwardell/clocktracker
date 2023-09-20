/*
  Warnings:

  - You are about to drop the column `enable_bgstats` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "enable_bgstats";

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "enable_bgstats" BOOLEAN NOT NULL DEFAULT false;
