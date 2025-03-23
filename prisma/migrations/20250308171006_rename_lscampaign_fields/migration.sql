/*
  Warnings:

  - You are about to drop the column `max_demon` on the `LSCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `max_minion` on the `LSCampaign` table. All the data in the column will be lost.
  - Added the required column `max_demons` to the `LSCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_minions` to the `LSCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LSCampaign" DROP COLUMN "max_demon",
DROP COLUMN "max_minion",
ADD COLUMN     "max_demons" INTEGER NOT NULL,
ADD COLUMN     "max_minions" INTEGER NOT NULL;
