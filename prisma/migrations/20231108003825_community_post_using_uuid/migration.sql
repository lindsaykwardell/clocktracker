/*
  Warnings:

  - The primary key for the `CommunityPost` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "CommunityPost" DROP CONSTRAINT "CommunityPost_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CommunityPost_id_seq";
