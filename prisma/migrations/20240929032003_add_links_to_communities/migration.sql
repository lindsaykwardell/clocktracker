/*
  Warnings:

  - You are about to drop the `ExternalLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExternalLink" DROP CONSTRAINT "ExternalLink_user_id_fkey";

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "links" TEXT[];

-- DropTable
DROP TABLE "ExternalLink";
