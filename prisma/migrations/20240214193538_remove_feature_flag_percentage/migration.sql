/*
  Warnings:

  - You are about to drop the column `percentage` on the `FeatureFlag` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "FeatureFlag" DROP COLUMN "percentage";
