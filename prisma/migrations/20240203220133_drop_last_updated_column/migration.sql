/*
  Warnings:

  - You are about to drop the column `characters_last_updated` on the `Script` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "Script" DROP COLUMN "characters_last_updated";
